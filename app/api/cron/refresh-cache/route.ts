import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { searchRecipes, getRecipeInformation } from "@/lib/spoonacular";
import {
  loadTaxonomyMaps,
  rebuildTrending,
  syncTaxonomyJoins,
  upsertCachedRecipe,
  upsertRecipeSteps,
  type TaxonomyMaps,
} from "@/lib/cache";
import { CRON_PRIORITY_CUISINES } from "@/lib/constants";
import type { SpoonacularSearchResult } from "@/lib/types";

// This route makes ~50 sequential external API calls, which can take longer
// than the platform default. 60s is the max allowed on Vercel's Hobby plan.
export const maxDuration = 60;

type AdminClient = ReturnType<typeof createAdminClient>;

// Spoonacular's free plan allows 150 requests/day. This route runs once a
// day and stays well under that: ~12 search calls (4 meal-type groups + 8
// cuisines) plus up to STEP_FETCH_BUDGET recipe-information calls.
const STEP_FETCH_BUDGET = 40;

async function recipeHasSteps(admin: AdminClient, cachedRecipeId: number): Promise<boolean> {
  const { count, error } = await admin
    .from("cached_recipe_steps")
    .select("id", { count: "exact", head: true })
    .eq("cached_recipe_id", cachedRecipeId);
  if (error) throw error;
  return (count ?? 0) > 0;
}

/** Upsert a recipe + its taxonomy, fetching step instructions if budget allows and not already cached. */
async function processRecipe(
  admin: AdminClient,
  taxonomy: TaxonomyMaps,
  recipe: SpoonacularSearchResult,
  stats: { recipesUpserted: number; stepsFetched: number; requestsUsed: number }
): Promise<number> {
  const cachedId = await upsertCachedRecipe(admin, recipe);
  await syncTaxonomyJoins(admin, cachedId, recipe.cuisines ?? [], recipe.dishTypes ?? [], taxonomy);
  stats.recipesUpserted += 1;

  if (stats.stepsFetched < STEP_FETCH_BUDGET) {
    const hasSteps = await recipeHasSteps(admin, cachedId);
    if (!hasSteps) {
      const info = await getRecipeInformation(recipe.id);
      stats.requestsUsed += 1;
      await upsertRecipeSteps(admin, cachedId, info);
      stats.stepsFetched += 1;
    }
  }

  return cachedId;
}

export async function GET(request: Request) {
  // Vercel Cron sends `Authorization: Bearer <CRON_SECRET>`. A `?secret=` query
  // param is also accepted so this can be triggered manually from a browser.
  const authHeader = request.headers.get("authorization");
  const secretParam = new URL(request.url).searchParams.get("secret");
  const isAuthorized =
    authHeader === `Bearer ${process.env.CRON_SECRET}` || secretParam === process.env.CRON_SECRET;

  if (!isAuthorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const admin = createAdminClient();
    const taxonomy = await loadTaxonomyMaps(admin);

    const { data: mealTypeRows, error: mealTypeError } = await admin
      .from("meal_types")
      .select("id, spoonacular_type");
    if (mealTypeError) {
      return NextResponse.json({ error: mealTypeError.message }, { status: 500 });
    }

    const stats = { recipesUpserted: 0, stepsFetched: 0, requestsUsed: 0, trendingRows: 0 };

    // Group meal types sharing a Spoonacular dish type (lunch/dinner both map
    // to "main course") so they're fetched in a single call and split between
    // the two trending rows, instead of duplicating the same query twice.
    const groups = new Map<string, { id: number }[]>();
    for (const mealType of mealTypeRows ?? []) {
      const key = mealType.spoonacular_type;
      const group = groups.get(key) ?? [];
      group.push({ id: mealType.id });
      groups.set(key, group);
    }

    for (const [spoonacularType, mealTypesInGroup] of groups) {
      const { results } = await searchRecipes({
        type: spoonacularType,
        sort: "popularity",
        number: 10 * mealTypesInGroup.length,
      });
      stats.requestsUsed += 1;

      for (let i = 0; i < mealTypesInGroup.length; i++) {
        const slice = results.slice(i * 10, (i + 1) * 10);
        const cachedIds: number[] = [];
        for (const recipe of slice) {
          cachedIds.push(await processRecipe(admin, taxonomy, recipe, stats));
        }
        await rebuildTrending(admin, mealTypesInGroup[i].id, cachedIds);
        stats.trendingRows += cachedIds.length;
      }
    }

    for (const cuisineSlug of CRON_PRIORITY_CUISINES) {
      const { results } = await searchRecipes({ cuisine: cuisineSlug, sort: "popularity", number: 10 });
      stats.requestsUsed += 1;

      for (const recipe of results) {
        await processRecipe(admin, taxonomy, recipe, stats);
      }
    }

    return NextResponse.json({ ok: true, stats });
  } catch (error) {
    console.error("refresh-cache failed", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
