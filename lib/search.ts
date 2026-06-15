import { createAdminClient } from "./supabase/admin";
import { searchRecipes } from "./spoonacular";
import { loadTaxonomyMaps, syncTaxonomyJoins, upsertCachedRecipe } from "./cache";

/** ISO timestamp `hours` ago, for "has this query been searched recently?" checks. */
export function hoursAgoIso(hours: number): string {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

/**
 * Live-search Spoonacular for a free-text query (optionally scoped to a
 * cuisine/meal type), caching every result into `cached_recipes` so it shows
 * up in future browsing/searches too. Returns the `cached_recipes.id`s.
 */
export async function liveSearchAndCache(
  query: string,
  filters: { cuisine?: string; type?: string } = {}
): Promise<number[]> {
  const admin = createAdminClient();
  const taxonomy = await loadTaxonomyMaps(admin);

  const { results } = await searchRecipes({
    query,
    cuisine: filters.cuisine,
    type: filters.type,
    number: 10,
  });

  const cachedIds: number[] = [];
  for (const recipe of results) {
    const cachedId = await upsertCachedRecipe(admin, recipe);
    await syncTaxonomyJoins(admin, cachedId, recipe.cuisines ?? [], recipe.dishTypes ?? [], taxonomy);
    cachedIds.push(cachedId);
  }

  return cachedIds;
}
