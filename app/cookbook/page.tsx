import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { RecipeCard } from "@/components/RecipeCard";
import type { CachedRecipe } from "@/lib/types";

type RecipeCardData = Pick<
  CachedRecipe,
  "id" | "title" | "image_url" | "spoonacular_score" | "ready_in_minutes"
>;

type SaveRow = {
  cached_recipe_id: number;
  cached_recipes: RecipeCardData | null;
};

export default async function CookbookPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/cookbook");
  }

  const { data: saves } = await supabase
    .from("recipe_saves")
    .select(
      "cached_recipe_id, cached_recipes(id, title, image_url, spoonacular_score, ready_in_minutes)"
    )
    .eq("user_id", user.id)
    .returns<SaveRow[]>();

  const { data: notes } = await supabase
    .from("recipe_notes")
    .select("cached_recipe_id, notes")
    .eq("user_id", user.id);

  const notesByRecipeId = new Map((notes ?? []).map((note) => [note.cached_recipe_id, note.notes]));

  const recipes = (saves ?? [])
    .map((row) => row.cached_recipes)
    .filter((recipe): recipe is RecipeCardData => recipe !== null);

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <header className="space-y-2">
        <h1 className="font-display text-2xl font-bold text-stone-900">My Cookbook</h1>
        <p className="text-stone-500">Your saved recipes and notes.</p>
      </header>

      {recipes.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {recipes.map((recipe) => (
            <div key={recipe.id} className="space-y-2">
              <RecipeCard recipe={recipe} />
              {notesByRecipeId.get(recipe.id) ? (
                <p className="line-clamp-2 px-1 text-xs text-stone-500">
                  {notesByRecipeId.get(recipe.id)}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-stone-500">
          You haven&apos;t saved any recipes yet — browse and tap the heart on a recipe to add it
          here.
        </p>
      )}
    </main>
  );
}
