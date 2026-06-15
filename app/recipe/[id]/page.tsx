import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { RatingBadge } from "@/components/RatingBadge";
import { StepCard } from "@/components/StepCard";
import type { CachedRecipe, CachedRecipeStep } from "@/lib/types";

type RecipeDetailData = Pick<
  CachedRecipe,
  | "id"
  | "title"
  | "image_url"
  | "source_url"
  | "ready_in_minutes"
  | "servings"
  | "spoonacular_score"
  | "cuisines"
  | "meal_types_raw"
>;

export default async function RecipeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const recipeId = Number(id);
  const supabase = await createClient();

  const { data: recipe } = await supabase
    .from("cached_recipes")
    .select(
      "id, title, image_url, source_url, ready_in_minutes, servings, spoonacular_score, cuisines, meal_types_raw"
    )
    .eq("id", recipeId)
    .maybeSingle()
    .returns<RecipeDetailData | null>();

  if (!recipe) {
    notFound();
  }

  const { data: steps } = await supabase
    .from("cached_recipe_steps")
    .select("id, cached_recipe_id, step_number, description, image_url, ingredient_images")
    .eq("cached_recipe_id", recipeId)
    .order("step_number")
    .returns<CachedRecipeStep[]>();

  const badges = [...recipe.cuisines, ...recipe.meal_types_raw];

  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <div className="space-y-4">
        {recipe.image_url ? (
          <div className="relative h-64 w-full overflow-hidden rounded-xl bg-black/5 sm:h-80">
            <Image
              src={recipe.image_url}
              alt={recipe.title}
              fill
              sizes="768px"
              className="object-cover"
              priority
            />
          </div>
        ) : null}

        <div className="space-y-2">
          <h1 className="text-2xl font-bold">{recipe.title}</h1>

          <div className="flex flex-wrap items-center gap-2 text-sm text-black/60">
            <RatingBadge score={recipe.spoonacular_score} />
            {recipe.ready_in_minutes ? <span>{recipe.ready_in_minutes} min</span> : null}
            {recipe.servings ? <span>Serves {recipe.servings}</span> : null}
          </div>

          {badges.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {badges.map((badge) => (
                <span
                  key={badge}
                  className="rounded-full bg-black/5 px-2 py-0.5 text-xs font-medium capitalize text-black/70"
                >
                  {badge}
                </span>
              ))}
            </div>
          ) : null}

          {recipe.source_url ? (
            <p className="text-sm">
              <Link
                href={recipe.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-amber-700 hover:underline"
              >
                View original recipe / video →
              </Link>
            </p>
          ) : null}
        </div>
      </div>

      {steps && steps.length > 0 ? (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Steps</h2>
          <ol className="space-y-3">
            {steps.map((step) => (
              <StepCard key={step.id} step={step} />
            ))}
          </ol>
        </div>
      ) : (
        <p className="text-black/60">
          Step-by-step instructions aren&apos;t cached for this recipe yet — check the original
          recipe link above.
        </p>
      )}
    </main>
  );
}
