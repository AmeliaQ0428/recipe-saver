"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export function RecipeNotes({
  cachedRecipeId,
  initialNotes,
  isLoggedIn,
}: {
  cachedRecipeId: number;
  initialNotes: string;
  isLoggedIn: boolean;
}) {
  const [notes, setNotes] = useState(initialNotes);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  if (!isLoggedIn) {
    return (
      <section className="rounded-2xl border border-amber-100 bg-amber-50/60 p-4">
        <h2 className="font-display text-lg font-semibold text-stone-900">Your notes</h2>
        <p className="mt-1 text-sm text-stone-600">
          <Link
            href={`/login?redirect=/recipe/${cachedRecipeId}`}
            className="font-medium text-amber-700 hover:underline"
          >
            Log in
          </Link>{" "}
          to keep your own notes on this recipe.
        </p>
      </section>
    );
  }

  async function save() {
    setSaving(true);
    setSaved(false);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      await supabase.from("recipe_notes").upsert(
        {
          user_id: user.id,
          cached_recipe_id: cachedRecipeId,
          notes,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,cached_recipe_id" }
      );
      setSaved(true);
    }

    setSaving(false);
  }

  return (
    <section className="rounded-2xl border border-amber-100 bg-amber-50/60 p-4">
      <h2 className="font-display text-lg font-semibold text-stone-900">Your notes</h2>
      <p className="mt-1 text-sm text-stone-500">
        Substitutions, timing tweaks, anything to remember for next time.
      </p>
      <textarea
        value={notes}
        onChange={(event) => {
          setNotes(event.target.value);
          setSaved(false);
        }}
        rows={4}
        placeholder="e.g. used double the garlic, needed 5 fewer minutes…"
        className="mt-3 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
      />
      <div className="mt-2 flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="rounded-full bg-amber-600 px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save notes"}
        </button>
        {saved ? <span className="text-sm text-stone-500">Saved</span> : null}
      </div>
    </section>
  );
}
