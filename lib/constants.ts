export const MEAL_TYPES = [
  { slug: "breakfast", label: "Breakfast", spoonacular_type: "breakfast" },
  { slug: "lunch", label: "Lunch", spoonacular_type: "main course" },
  { slug: "dinner", label: "Dinner", spoonacular_type: "main course" },
  { slug: "dessert", label: "Dessert", spoonacular_type: "dessert" },
  { slug: "snack", label: "Snack", spoonacular_type: "snack" },
] as const;

export const CUISINES = [
  { slug: "italian", label: "Italian" },
  { slug: "mexican", label: "Mexican" },
  { slug: "chinese", label: "Chinese" },
  { slug: "japanese", label: "Japanese" },
  { slug: "thai", label: "Thai" },
  { slug: "vietnamese", label: "Vietnamese" },
  { slug: "indian", label: "Indian" },
  { slug: "french", label: "French" },
  { slug: "greek", label: "Greek" },
  { slug: "mediterranean", label: "Mediterranean" },
  { slug: "american", label: "American" },
  { slug: "korean", label: "Korean" },
  { slug: "spanish", label: "Spanish" },
  { slug: "middle eastern", label: "Middle Eastern" },
] as const;

/** Cuisines fetched daily by the cache-refresh cron, in addition to the meal-type rows. */
export const CRON_PRIORITY_CUISINES = [
  "vietnamese",
  "thai",
  "chinese",
  "mexican",
  "japanese",
  "indian",
  "italian",
  "korean",
] as const;

export const SORT_OPTIONS = [
  { value: "rating", label: "Highest rated" },
  { value: "time", label: "Quickest" },
] as const;
