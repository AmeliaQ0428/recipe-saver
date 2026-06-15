import { createClient } from "@/lib/supabase/server";
import { hoursAgoIso, liveSearchAndCache } from "@/lib/search";
import { FilterBar } from "@/components/FilterBar";
import { RecipeCard } from "@/components/RecipeCard";
import type { CachedRecipe } from "@/lib/types";

type RecipeCardData = Pick<
  CachedRecipe,
  "id" | "title" | "image_url" | "spoonacular_score" | "ready_in_minutes"
>;

const SEARCH_CACHE_WINDOW_HOURS = 6;

/** Escape Postgres ILIKE wildcards so user input is matched literally. */
function escapeLikePattern(value: string): string {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`);
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ cuisine?: string; mealType?: string; sort?: string; q?: string }>;
}) {
  const { cuisine, mealType, sort, q } = await searchParams;
  const supabase = await createClient();

  // Resolve cuisine/meal-type filters to the set of matching recipe ids via
  // the join tables, then intersect them before querying cached_recipes.
  let recipeIds: number[] | null = null;
  let cuisineLabel: string | undefined;
  let mealTypeSpoonacularType: string | undefined;

  if (cuisine) {
    const { data: cuisineRow } = await supabase
      .from("cuisines")
      .select("id, label")
      .eq("slug", cuisine)
      .maybeSingle();

    if (cuisineRow) {
      cuisineLabel = cuisineRow.label;
      const { data: joins } = await supabase
        .from("cached_recipe_cuisines")
        .select("cached_recipe_id")
        .eq("cuisine_id", cuisineRow.id);
      recipeIds = (joins ?? []).map((j) => j.cached_recipe_id as number);
    } else {
      recipeIds = [];
    }
  }

  if (mealType) {
    const { data: mealTypeRow } = await supabase
      .from("meal_types")
      .select("id, spoonacular_type")
      .eq("slug", mealType)
      .maybeSingle();

    let mealTypeRecipeIds: number[] = [];
    if (mealTypeRow) {
      mealTypeSpoonacularType = mealTypeRow.spoonacular_type;
      const { data: joins } = await supabase
        .from("cached_recipe_meal_types")
        .select("cached_recipe_id")
        .eq("meal_type_id", mealTypeRow.id);
      mealTypeRecipeIds = (joins ?? []).map((j) => j.cached_recipe_id as number);
    }

    recipeIds =
      recipeIds === null
        ? mealTypeRecipeIds
        : recipeIds.filter((id) => mealTypeRecipeIds.includes(id));
  }

  // Free-text search: check for a recent identical search before calling
  // Spoonacular live (each live search costs API quota).
  let searchIds: number[] | null = null;
  const normalizedQuery = q?.trim().toLowerCase();

  if (normalizedQuery) {
    const cacheWindowStart = hoursAgoIso(SEARCH_CACHE_WINDOW_HOURS);

    const { data: recentSearches } = await supabase
      .from("search_activity_log")
      .select("cached_recipe_id")
      .eq("event_type", "search")
      .eq("query_text", normalizedQuery)
      .gte("created_at", cacheWindowStart);

    if (recentSearches && recentSearches.length > 0) {
      searchIds = recentSearches
        .map((row) => row.cached_recipe_id)
        .filter((id): id is number => id !== null);
    } else {
      // If the live Spoonacular call fails (e.g. daily quota exhausted),
      // fall back to local cache results below rather than 500ing the page.
      let liveIds: number[] = [];
      try {
        liveIds = await liveSearchAndCache(normalizedQuery, {
          cuisine: cuisineLabel,
          type: mealTypeSpoonacularType,
        });

        const logRows: { event_type: string; query_text: string; cached_recipe_id: number | null }[] =
          liveIds.length > 0
            ? liveIds.map((cached_recipe_id) => ({
                event_type: "search",
                query_text: normalizedQuery,
                cached_recipe_id,
              }))
            : [{ event_type: "search", query_text: normalizedQuery, cached_recipe_id: null }];
        await supabase.from("search_activity_log").insert(logRows);
      } catch (error) {
        console.error("Live search failed, falling back to cached results:", error);
      }

      searchIds = liveIds;
    }

    // Also pick up any locally-cached recipes whose title matches, even if
    // they weren't part of a prior live search for this exact query.
    const { data: titleMatches } = await supabase
      .from("cached_recipes")
      .select("id")
      .ilike("title", `%${escapeLikePattern(normalizedQuery)}%`);

    for (const row of titleMatches ?? []) {
      if (!searchIds.includes(row.id as number)) {
        searchIds.push(row.id as number);
      }
    }
  }

  if (searchIds !== null) {
    recipeIds = recipeIds === null ? searchIds : recipeIds.filter((id) => searchIds!.includes(id));
  }

  let recipes: RecipeCardData[] = [];

  if (recipeIds === null || recipeIds.length > 0) {
    let query = supabase
      .from("cached_recipes")
      .select("id, title, image_url, spoonacular_score, ready_in_minutes");

    if (recipeIds !== null) {
      query = query.in("id", recipeIds);
    }

    query =
      sort === "time"
        ? query.order("ready_in_minutes", { ascending: true, nullsFirst: false })
        : query.order("spoonacular_score", { ascending: false, nullsFirst: false });

    const { data } = await query.limit(40).returns<RecipeCardData[]>();
    recipes = data ?? [];
  }

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <header className="space-y-2">
        <h1 className="font-display text-2xl font-bold text-stone-900">Browse recipes</h1>
        <FilterBar />
      </header>

      {recipes.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {recipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      ) : (
        <p className="text-stone-500">
          {normalizedQuery
            ? `No recipes found for "${q}". Try a different search term or filters.`
            : "No recipes match these filters yet — try a different cuisine or meal type, or check back after the next daily refresh."}
        </p>
      )}
    </main>
  );
}
