import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { MealTypeRow } from "@/components/MealTypeRow";
import type { CachedRecipe } from "@/lib/types";

type RecipeCardData = Pick<
  CachedRecipe,
  "id" | "title" | "image_url" | "spoonacular_score" | "ready_in_minutes"
>;

type TrendingRow = {
  rank: number;
  cached_recipes: RecipeCardData | null;
};

export default async function HomePage() {
  const supabase = await createClient();

  const { data: mealTypes } = await supabase
    .from("meal_types")
    .select("id, slug, label")
    .order("id");

  const rows = await Promise.all(
    (mealTypes ?? []).map(async (mealType) => {
      const { data } = await supabase
        .from("trending_recipes")
        .select("rank, cached_recipes(id, title, image_url, spoonacular_score, ready_in_minutes)")
        .eq("meal_type_id", mealType.id)
        .eq("source", "spoonacular_popular")
        .order("rank")
        .limit(10)
        .returns<TrendingRow[]>();

      const recipes = (data ?? [])
        .map((row) => row.cached_recipes)
        .filter((recipe): recipe is RecipeCardData => recipe !== null);

      return { mealType, recipes };
    })
  );

  const hasAnyRecipes = rows.some((row) => row.recipes.length > 0);

  return (
    <main className="mx-auto max-w-5xl space-y-8 px-4 py-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold">What to cook today</h1>
        <p className="text-black/60">Trending recipes by meal, refreshed daily.</p>
      </header>

      {hasAnyRecipes ? (
        rows.map(({ mealType, recipes }) => (
          <MealTypeRow
            key={mealType.id}
            label={mealType.label}
            mealTypeSlug={mealType.slug}
            recipes={recipes}
          />
        ))
      ) : (
        <p className="text-black/60">
          No recipes cached yet — once the daily refresh runs, recommendations will appear here.
        </p>
      )}

      <div>
        <Link href="/search" className="font-medium text-amber-700 hover:underline">
          Browse all recipes →
        </Link>
      </div>
    </main>
  );
}
