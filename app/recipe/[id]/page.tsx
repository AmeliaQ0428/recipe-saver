import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getRecipeInformation } from "@/lib/spoonacular";
import { upsertRecipeIngredients, upsertRecipeSteps } from "@/lib/cache";
import { RatingBadge } from "@/components/RatingBadge";
import { StepCard } from "@/components/StepCard";
import { FavoriteButton } from "@/components/FavoriteButton";
import { RecipeNotes } from "@/components/RecipeNotes";
import { IngredientsList } from "@/components/IngredientsList";
import type { CachedRecipe, CachedRecipeIngredient, CachedRecipeStep } from "@/lib/types";

type RecipeDetailData = Pick<
  CachedRecipe,
  | "id"
  | "spoonacular_id"
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
      "id, spoonacular_id, title, image_url, source_url, ready_in_minutes, servings, spoonacular_score, cuisines, meal_types_raw"
    )
    .eq("id", recipeId)
    .maybeSingle()
    .returns<RecipeDetailData | null>();

  if (!recipe) {
    notFound();
  }

  let { data: steps } = await supabase
    .from("cached_recipe_steps")
    .select("id, cached_recipe_id, step_number, description, image_url, ingredient_images")
    .eq("cached_recipe_id", recipeId)
    .order("step_number")
    .returns<CachedRecipeStep[]>();

  let { data: ingredients } = await supabase
    .from("cached_recipe_ingredients")
    .select("id, cached_recipe_id, sort_order, name, amount, unit, original")
    .eq("cached_recipe_id", recipeId)
    .order("sort_order")
    .returns<CachedRecipeIngredient[]>();

  // Newly-discovered recipes (from a live search) - or recipes cached before
  // ingredients were tracked - often don't have steps/ingredients yet. Try to
  // fetch them once, falling back quietly if it fails (e.g. daily Spoonacular
  // quota reached).
  if ((!steps || steps.length === 0 || !ingredients || ingredients.length === 0) && recipe.spoonacular_id) {
    try {
      const admin = createAdminClient();
      const info = await getRecipeInformation(recipe.spoonacular_id);
      await upsertRecipeSteps(admin, recipeId, info);
      await upsertRecipeIngredients(admin, recipeId, info);

      const { data: freshSteps } = await supabase
        .from("cached_recipe_steps")
        .select("id, cached_recipe_id, step_number, description, image_url, ingredient_images")
        .eq("cached_recipe_id", recipeId)
        .order("step_number")
        .returns<CachedRecipeStep[]>();
      steps = freshSteps;

      const { data: freshIngredients } = await supabase
        .from("cached_recipe_ingredients")
        .select("id, cached_recipe_id, sort_order, name, amount, unit, original")
        .eq("cached_recipe_id", recipeId)
        .order("sort_order")
        .returns<CachedRecipeIngredient[]>();
      ingredients = freshIngredients;
    } catch {
      // Leave steps/ingredients empty - the page shows the "not cached yet" message below.
    }
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let initialSaved = false;
  let initialNotes = "";

  if (user) {
    const { data: saveRow } = await supabase
      .from("recipe_saves")
      .select("id")
      .eq("user_id", user.id)
      .eq("cached_recipe_id", recipeId)
      .maybeSingle();
    initialSaved = !!saveRow;

    const { data: noteRow } = await supabase
      .from("recipe_notes")
      .select("notes")
      .eq("user_id", user.id)
      .eq("cached_recipe_id", recipeId)
      .maybeSingle();
    initialNotes = noteRow?.notes ?? "";
  }

  const badges = [...recipe.cuisines, ...recipe.meal_types_raw];

  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <div className="space-y-4">
        {recipe.image_url ? (
          <div className="relative h-64 w-full overflow-hidden rounded-3xl bg-stone-100 sm:h-96">
            <Image
              src={recipe.image_url}
              alt={recipe.title}
              fill
              sizes="768px"
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
            <h1 className="font-display absolute bottom-4 left-4 right-4 text-2xl font-bold text-white drop-shadow sm:text-4xl">
              {recipe.title}
            </h1>
          </div>
        ) : (
          <h1 className="font-display text-2xl font-bold text-stone-900 sm:text-4xl">
            {recipe.title}
          </h1>
        )}

        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-sm text-stone-600">
            <RatingBadge score={recipe.spoonacular_score} />
            {recipe.ready_in_minutes ? <span>{recipe.ready_in_minutes} min</span> : null}
            {recipe.servings ? <span>Serves {recipe.servings}</span> : null}
            <FavoriteButton
              cachedRecipeId={recipe.id}
              initialSaved={initialSaved}
              isLoggedIn={!!user}
            />
          </div>

          {badges.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {badges.map((badge) => (
                <span
                  key={badge}
                  className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium capitalize text-amber-800"
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

      <IngredientsList ingredients={ingredients ?? []} baseServings={recipe.servings} />

      {steps && steps.length > 0 ? (
        <div className="space-y-3">
          <h2 className="font-display text-lg font-semibold text-stone-900">Steps</h2>
          <ol className="space-y-3">
            {steps.map((step) => (
              <StepCard key={step.id} step={step} />
            ))}
          </ol>
        </div>
      ) : (
        <p className="text-stone-500">
          Step-by-step instructions aren&apos;t cached for this recipe yet — check the original
          recipe link above.
        </p>
      )}

      <RecipeNotes cachedRecipeId={recipe.id} initialNotes={initialNotes} isLoggedIn={!!user} />
    </main>
  );
}
