"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function FavoriteButton({
  cachedRecipeId,
  initialSaved,
  isLoggedIn,
}: {
  cachedRecipeId: number;
  initialSaved: boolean;
  isLoggedIn: boolean;
}) {
  const router = useRouter();
  const [saved, setSaved] = useState(initialSaved);
  const [pending, setPending] = useState(false);

  async function toggle() {
    if (!isLoggedIn) {
      router.push(`/login?redirect=/recipe/${cachedRecipeId}`);
      return;
    }

    setPending(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push(`/login?redirect=/recipe/${cachedRecipeId}`);
      setPending(false);
      return;
    }

    if (saved) {
      await supabase
        .from("recipe_saves")
        .delete()
        .eq("user_id", user.id)
        .eq("cached_recipe_id", cachedRecipeId);
      setSaved(false);
    } else {
      await supabase
        .from("recipe_saves")
        .insert({ user_id: user.id, cached_recipe_id: cachedRecipeId });
      setSaved(true);
    }
    setPending(false);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition disabled:opacity-60 ${
        saved
          ? "bg-amber-600 text-white hover:bg-amber-700"
          : "border border-amber-300 text-amber-700 hover:bg-amber-50"
      }`}
    >
      <span aria-hidden="true">{saved ? "♥" : "♡"}</span>
      {saved ? "Saved" : "Save"}
    </button>
  );
}
