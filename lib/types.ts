export type Cuisine = {
  id: number;
  slug: string;
  label: string;
};

export type MealType = {
  id: number;
  slug: string;
  label: string;
  spoonacular_type: string;
};

export type CachedRecipe = {
  id: number;
  spoonacular_id: number;
  title: string;
  image_url: string | null;
  source_url: string | null;
  ready_in_minutes: number | null;
  servings: number | null;
  spoonacular_score: number | null;
  aggregate_likes: number | null;
  cuisines: string[];
  meal_types_raw: string[];
};

export type CachedRecipeStep = {
  id: number;
  cached_recipe_id: number;
  step_number: number;
  description: string;
  image_url: string | null;
  ingredient_images: string[];
};

export type CachedRecipeDetail = CachedRecipe & {
  summary: string | null;
  steps: CachedRecipeStep[];
};

/** Shape of a single recipe from Spoonacular's complexSearch (with addRecipeInformation=true). */
export type SpoonacularSearchResult = {
  id: number;
  title: string;
  image?: string;
  sourceUrl?: string;
  readyInMinutes?: number;
  servings?: number;
  spoonacularScore?: number;
  aggregateLikes?: number;
  cuisines?: string[];
  dishTypes?: string[];
};

export type SpoonacularComplexSearchResponse = {
  results: SpoonacularSearchResult[];
};

/** Shape of the relevant fields from Spoonacular's recipe information endpoint. */
export type SpoonacularRecipeInformation = SpoonacularSearchResult & {
  summary?: string;
  analyzedInstructions?: {
    name: string;
    steps: {
      number: number;
      step: string;
      ingredients?: { id: number; name: string; image: string }[];
      equipment?: { id: number; name: string; image: string }[];
    }[];
  }[];
};
