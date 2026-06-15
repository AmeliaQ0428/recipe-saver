import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { MealTypeRow } from "@/components/MealTypeRow";
import { SearchBar } from "@/components/SearchBar";
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
    <main className="mx-auto max-w-5xl space-y-10 px-4 py-8">
      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-amber-100 via-orange-50 to-amber-50 px-6 py-10 sm:px-10 sm:py-14">
        <h1 className="font-display max-w-xl text-3xl font-bold text-stone-900 sm:text-5xl">
          What shall we cook today?
        </h1>
        <p className="mt-3 max-w-xl text-stone-600">
          Trending recipes by meal, refreshed daily — or search for something specific.
        </p>
        <SearchBar className="mt-6 max-w-md" />
      </section>

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
        <p className="text-stone-500">
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
