import Link from "next/link";
import { RecipeCard } from "./RecipeCard";
import type { CachedRecipe } from "@/lib/types";

type RecipeCardData = Pick<
  CachedRecipe,
  "id" | "title" | "image_url" | "spoonacular_score" | "ready_in_minutes"
>;

export function MealTypeRow({
  label,
  mealTypeSlug,
  recipes,
}: {
  label: string;
  mealTypeSlug: string;
  recipes: RecipeCardData[];
}) {
  if (recipes.length === 0) {
    return null;
  }

  return (
    <section className="space-y-3">
      <div className="flex items-baseline justify-between">
        <h2 className="font-display text-xl font-semibold text-stone-900">{label}</h2>
        <Link
          href={`/search?mealType=${mealTypeSlug}`}
          className="rounded-full border border-amber-200 px-3 py-1 text-sm font-medium text-amber-700 transition hover:bg-amber-50"
        >
          See all →
        </Link>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {recipes.map((recipe) => (
          <div key={recipe.id} className="w-56 shrink-0">
            <RecipeCard recipe={recipe} />
          </div>
        ))}
      </div>
    </section>
  );
}
