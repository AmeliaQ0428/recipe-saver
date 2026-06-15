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
      className="block overflow-hidden rounded-xl border border-black/10 bg-white transition hover:shadow-md"
    >
      <div className="relative h-36 w-full bg-black/5">
        {recipe.image_url ? (
          <Image
            src={recipe.image_url}
            alt={recipe.title}
            fill
            sizes="224px"
            className="object-cover"
          />
        ) : null}
      </div>
      <div className="space-y-1 p-3">
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug">{recipe.title}</h3>
        <div className="flex items-center gap-2 text-xs text-black/60">
          <RatingBadge score={recipe.spoonacular_score} />
          {recipe.ready_in_minutes ? <span>{recipe.ready_in_minutes} min</span> : null}
        </div>
      </div>
    </Link>
  );
}
