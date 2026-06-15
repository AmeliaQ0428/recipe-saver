import { createClient } from "@/lib/supabase/server";
import { FilterBar } from "@/components/FilterBar";
import { RecipeCard } from "@/components/RecipeCard";
import type { CachedRecipe } from "@/lib/types";

type RecipeCardData = Pick<
  CachedRecipe,
  "id" | "title" | "image_url" | "spoonacular_score" | "ready_in_minutes"
>;

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ cuisine?: string; mealType?: string; sort?: string }>;
}) {
  const { cuisine, mealType, sort } = await searchParams;
  const supabase = await createClient();

  // Resolve cuisine/meal-type filters to the set of matching recipe ids via
  // the join tables, then intersect them before querying cached_recipes.
  let recipeIds: number[] | null = null;

  if (cuisine) {
    const { data: cuisineRow } = await supabase
      .from("cuisines")
      .select("id")
      .eq("slug", cuisine)
      .maybeSingle();

    if (cuisineRow) {
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
      .select("id")
      .eq("slug", mealType)
      .maybeSingle();

    let mealTypeRecipeIds: number[] = [];
    if (mealTypeRow) {
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
        <h1 className="text-2xl font-bold">Browse recipes</h1>
        <FilterBar />
      </header>

      {recipes.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {recipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      ) : (
        <p className="text-black/60">
          No recipes match these filters yet — try a different cuisine or meal type, or check back
          after the next daily refresh.
        </p>
      )}
    </main>
  );
}
