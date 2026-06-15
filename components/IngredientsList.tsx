"use client";

import { useState } from "react";
import type { CachedRecipeIngredient } from "@/lib/types";

/** Round to 1 decimal place and strip a trailing ".0" (e.g. 226.8, 2, 0.5). */
function formatAmount(amount: number): string {
  const rounded = Math.round(amount * 10) / 10;
  return rounded % 1 === 0 ? String(rounded) : rounded.toFixed(1);
}

export function IngredientsList({
  ingredients,
  baseServings,
}: {
  ingredients: CachedRecipeIngredient[];
  baseServings: number | null;
}) {
  const [servings, setServings] = useState(baseServings ?? 1);

  if (ingredients.length === 0) {
    return null;
  }

  const ratio = baseServings ? servings / baseServings : 1;

  return (
    <section className="space-y-3">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="font-display text-lg font-semibold text-stone-900">Ingredients</h2>
        {baseServings ? (
          <label className="flex items-center gap-2 text-sm text-stone-600">
            Servings
            <input
              type="number"
              min={1}
              value={servings}
              onChange={(event) => {
                const value = Number(event.target.value);
                setServings(value > 0 ? value : 1);
              }}
              className="w-16 rounded-lg border border-stone-300 bg-white px-2 py-1 text-center focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </label>
        ) : null}
      </div>
      <ul className="space-y-1.5 text-sm text-stone-700">
        {ingredients.map((ingredient) => (
          <li key={ingredient.id} className="flex gap-2">
            <span className="text-amber-600">•</span>
            {ingredient.amount && ingredient.amount > 0 ? (
              <span>
                <span className="font-medium text-stone-900">
                  {formatAmount(ingredient.amount * ratio)}
                  {ingredient.unit ? ` ${ingredient.unit}` : ""}
                </span>{" "}
                {ingredient.name}
              </span>
            ) : (
              <span>{ingredient.original}</span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
