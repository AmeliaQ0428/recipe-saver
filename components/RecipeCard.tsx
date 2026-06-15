import Image from "next/image";
import Link from "next/link";
import { RatingBadge } from "./RatingBadge";
import type { CachedRecipe } from "@/lib/types";

type RecipeCardData = Pick<
  CachedRecipe,
  "id" | "title" | "image_url" | "spoonacular_score" | "ready_in_minutes"
>;

export function RecipeCard({ recipe }: { recipe: RecipeCardData }) {
  return (
    <Link
      href={`/recipe/${recipe.id}`}
      className="group block overflow-hidden rounded-2xl border border-stone-200 bg-white transition hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-stone-100">
        {recipe.image_url ? (
          <Image
            src={recipe.image_url}
            alt={recipe.title}
            fill
            sizes="224px"
            className="object-cover transition duration-300 group-hover:scale-105"
          />
        ) : null}
        {recipe.spoonacular_score !== null ? (
          <div className="absolute right-2 top-2">
            <RatingBadge score={recipe.spoonacular_score} overlay />
          </div>
        ) : null}
      </div>
      <div className="space-y-1 p-3">
        <h3 className="font-display line-clamp-2 text-sm font-semibold leading-snug text-stone-900">
          {recipe.title}
        </h3>
        {recipe.ready_in_minutes ? (
          <p className="text-xs text-stone-500">{recipe.ready_in_minutes} min</p>
        ) : null}
      </div>
    </Link>
  );
}
