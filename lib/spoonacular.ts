import type {
  SpoonacularComplexSearchResponse,
  SpoonacularRecipeInformation,
} from "./types";

const BASE_URL = "https://api.spoonacular.com";

function apiKey() {
  const key = process.env.SPOONACULAR_API_KEY;
  if (!key) {
    throw new Error("SPOONACULAR_API_KEY is not set");
  }
  return key;
}

/**
 * Search recipes via Spoonacular's complexSearch endpoint, with full recipe
 * info (image, score, cuisines, etc.) attached to each result.
 */
export async function searchRecipes(params: {
  type?: string;
  cuisine?: string;
  query?: string;
  sort?: string;
  number?: number;
}): Promise<SpoonacularComplexSearchResponse> {
  const search = new URLSearchParams({
    apiKey: apiKey(),
    addRecipeInformation: "true",
    number: String(params.number ?? 10),
    sort: params.sort ?? "popularity",
  });
  if (params.type) search.set("type", params.type);
  if (params.cuisine) search.set("cuisine", params.cuisine);
  if (params.query) search.set("query", params.query);

  const res = await fetch(`${BASE_URL}/recipes/complexSearch?${search.toString()}`);
  if (!res.ok) {
    throw new Error(`Spoonacular complexSearch failed: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

/**
 * Fetch full recipe information, including step-by-step instructions
 * (analyzedInstructions), for a single Spoonacular recipe id.
 */
export async function getRecipeInformation(
  id: number
): Promise<SpoonacularRecipeInformation> {
  const search = new URLSearchParams({
    apiKey: apiKey(),
    includeNutrition: "false",
  });

  const res = await fetch(`${BASE_URL}/recipes/${id}/information?${search.toString()}`);
  if (!res.ok) {
    throw new Error(`Spoonacular recipe information failed: ${res.status} ${await res.text()}`);
  }
  return res.json();
}
