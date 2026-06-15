import type { SupabaseClient } from "@supabase/supabase-js";
import type { SpoonacularRecipeInformation, SpoonacularSearchResult } from "./types";

export type TaxonomyMaps = {
  /** lowercase cuisine label -> cuisines.id */
  cuisineByLabel: Map<string, number>;
  /** lowercase meal_types.spoonacular_type -> meal_types.id[] (e.g. "main course" -> [lunch, dinner]) */
  mealTypeIdsBySpoonacularType: Map<string, number[]>;
};

/** Load cuisine/meal-type lookup tables once per cron run, reused across every recipe. */
export async function loadTaxonomyMaps(admin: SupabaseClient): Promise<TaxonomyMaps> {
  const [{ data: cuisines, error: cuisinesError }, { data: mealTypes, error: mealTypesError }] =
    await Promise.all([
      admin.from("cuisines").select("id, label"),
      admin.from("meal_types").select("id, spoonacular_type"),
    ]);

  if (cuisinesError) throw cuisinesError;
  if (mealTypesError) throw mealTypesError;

  const cuisineByLabel = new Map<string, number>();
  for (const c of cuisines ?? []) {
    cuisineByLabel.set(c.label.toLowerCase(), c.id);
  }

  const mealTypeIdsBySpoonacularType = new Map<string, number[]>();
  for (const m of mealTypes ?? []) {
    const key = m.spoonacular_type.toLowerCase();
    const existing = mealTypeIdsBySpoonacularType.get(key) ?? [];
    existing.push(m.id);
    mealTypeIdsBySpoonacularType.set(key, existing);
  }

  return { cuisineByLabel, mealTypeIdsBySpoonacularType };
}

/** Upsert a recipe's core fields, returning its `cached_recipes.id`. */
export async function upsertCachedRecipe(
  admin: SupabaseClient,
  recipe: SpoonacularSearchResult
): Promise<number> {
  const cuisines = recipe.cuisines ?? [];
  const mealTypesRaw = recipe.dishTypes ?? [];

  const { data, error } = await admin
    .from("cached_recipes")
    .upsert(
      {
        spoonacular_id: recipe.id,
        title: recipe.title,
        image_url: recipe.image ?? null,
        source_url: recipe.sourceUrl ?? null,
        ready_in_minutes: recipe.readyInMinutes ?? null,
        servings: recipe.servings ?? null,
        spoonacular_score: recipe.spoonacularScore ?? null,
        aggregate_likes: recipe.aggregateLikes ?? null,
        cuisines,
        meal_types_raw: mealTypesRaw,
        raw_json: recipe,
        last_fetched_at: new Date().toISOString(),
      },
      { onConflict: "spoonacular_id" }
    )
    .select("id")
    .single();

  if (error) throw error;
  return data.id as number;
}

/** Populate the cuisine/meal-type join tables for a cached recipe, replacing any prior rows. */
export async function syncTaxonomyJoins(
  admin: SupabaseClient,
  cachedRecipeId: number,
  cuisines: string[],
  dishTypes: string[],
  taxonomy: TaxonomyMaps
) {
  const cuisineIds = new Set<number>();
  for (const c of cuisines) {
    const id = taxonomy.cuisineByLabel.get(c.toLowerCase());
    if (id) cuisineIds.add(id);
  }

  const mealTypeIds = new Set<number>();
  for (const d of dishTypes) {
    const ids = taxonomy.mealTypeIdsBySpoonacularType.get(d.toLowerCase());
    if (ids) ids.forEach((id) => mealTypeIds.add(id));
  }

  const { error: deleteCuisinesError } = await admin
    .from("cached_recipe_cuisines")
    .delete()
    .eq("cached_recipe_id", cachedRecipeId);
  if (deleteCuisinesError) throw deleteCuisinesError;

  const { error: deleteMealTypesError } = await admin
    .from("cached_recipe_meal_types")
    .delete()
    .eq("cached_recipe_id", cachedRecipeId);
  if (deleteMealTypesError) throw deleteMealTypesError;

  if (cuisineIds.size > 0) {
    const { error } = await admin.from("cached_recipe_cuisines").insert(
      Array.from(cuisineIds).map((cuisine_id) => ({
        cached_recipe_id: cachedRecipeId,
        cuisine_id,
      }))
    );
    if (error) throw error;
  }

  if (mealTypeIds.size > 0) {
    const { error } = await admin.from("cached_recipe_meal_types").insert(
      Array.from(mealTypeIds).map((meal_type_id) => ({
        cached_recipe_id: cachedRecipeId,
        meal_type_id,
      }))
    );
    if (error) throw error;
  }
}

/**
 * Upsert step-by-step instructions for a recipe. Since Spoonacular has no
 * per-step photos, each step is given the recipe's main image. Each step's
 * ingredients are matched against `extendedIngredients` (by Spoonacular
 * ingredient id) to attach a metric quantity where available.
 */
export async function upsertRecipeSteps(
  admin: SupabaseClient,
  cachedRecipeId: number,
  info: SpoonacularRecipeInformation
) {
  const steps = info.analyzedInstructions?.[0]?.steps ?? [];
  if (steps.length === 0) return;

  const measureById = new Map<number, { amount: number | null; unit: string | null }>();
  for (const ingredient of info.extendedIngredients ?? []) {
    const metric = ingredient.measures?.metric;
    measureById.set(ingredient.id, {
      amount: metric?.amount ?? ingredient.amount ?? null,
      unit: metric?.unitShort ?? ingredient.unit ?? null,
    });
  }

  const rows = steps.map((step) => {
    const stepIngredients = (step.ingredients ?? []).map((ingredient) => {
      const measure = measureById.get(ingredient.id);
      return {
        name: ingredient.name,
        amount: measure?.amount ?? null,
        unit: measure?.unit ?? null,
      };
    });

    return {
      cached_recipe_id: cachedRecipeId,
      step_number: step.number,
      description: step.step,
      image_url: info.image ?? null,
      step_ingredients: stepIngredients,
    };
  });

  const { error } = await admin
    .from("cached_recipe_steps")
    .upsert(rows, { onConflict: "cached_recipe_id,step_number" });

  if (error) throw error;
}

/**
 * Upsert a recipe's ingredient list, preferring Spoonacular's metric measure
 * (grams/ml/etc.) so quantities can be scaled by servings. Falls back to the
 * default amount/unit, with `original` kept for ingredients with no usable
 * amount (e.g. "salt to taste").
 */
export async function upsertRecipeIngredients(
  admin: SupabaseClient,
  cachedRecipeId: number,
  info: SpoonacularRecipeInformation
) {
  const ingredients = info.extendedIngredients ?? [];
  if (ingredients.length === 0) return;

  const rows = ingredients.map((ingredient, index) => {
    const metric = ingredient.measures?.metric;
    return {
      cached_recipe_id: cachedRecipeId,
      sort_order: index,
      name: ingredient.name,
      amount: metric?.amount ?? ingredient.amount ?? null,
      unit: metric?.unitShort ?? ingredient.unit ?? null,
      original: ingredient.original,
    };
  });

  const { error } = await admin
    .from("cached_recipe_ingredients")
    .upsert(rows, { onConflict: "cached_recipe_id,sort_order" });

  if (error) throw error;
}

/** Replace the ranked trending list for a meal type with a new ordered set of recipes. */
export async function rebuildTrending(
  admin: SupabaseClient,
  mealTypeId: number,
  cachedRecipeIds: number[],
  source = "spoonacular_popular"
) {
  const { error: deleteError } = await admin
    .from("trending_recipes")
    .delete()
    .eq("meal_type_id", mealTypeId)
    .eq("source", source);
  if (deleteError) throw deleteError;

  if (cachedRecipeIds.length === 0) return;

  const rows = cachedRecipeIds.map((cached_recipe_id, idx) => ({
    meal_type_id: mealTypeId,
    cached_recipe_id,
    rank: idx + 1,
    source,
  }));

  const { error: insertError } = await admin.from("trending_recipes").insert(rows);
  if (insertError) throw insertError;
}
