"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CUISINES, MEAL_TYPES, SORT_OPTIONS } from "@/lib/constants";

const ACTIVE_CHIP = "bg-amber-600 text-white shadow-sm";
const INACTIVE_CHIP = "bg-white border border-stone-200 text-stone-600 hover:bg-amber-50";

export function FilterBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const activeCuisine = searchParams.get("cuisine") ?? "";
  const activeMealType = searchParams.get("mealType") ?? "";
  const activeSort = searchParams.get("sort") ?? "rating";
  const activeQuery = searchParams.get("q") ?? "";
  const [queryInput, setQueryInput] = useState(activeQuery);

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="space-y-3">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          updateParam("q", queryInput.trim());
        }}
        className="flex max-w-md"
      >
        <input
          type="search"
          value={queryInput}
          onChange={(event) => setQueryInput(event.target.value)}
          placeholder="Search recipes…"
          className="w-full rounded-l-full border border-stone-300 bg-white px-4 py-1.5 text-sm text-stone-800 placeholder:text-stone-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
        />
        <button
          type="submit"
          className="rounded-r-full border border-l-0 border-amber-600 bg-amber-600 px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-amber-700"
        >
          Search
        </button>
      </form>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => updateParam("mealType", "")}
          className={`rounded-full px-3 py-1 text-sm font-medium ${
            activeMealType === "" ? ACTIVE_CHIP : INACTIVE_CHIP
          }`}
        >
          All meals
        </button>
        {MEAL_TYPES.map((mealType) => (
          <button
            key={mealType.slug}
            type="button"
            onClick={() => updateParam("mealType", mealType.slug)}
            className={`rounded-full px-3 py-1 text-sm font-medium ${
              activeMealType === mealType.slug ? ACTIVE_CHIP : INACTIVE_CHIP
            }`}
          >
            {mealType.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => updateParam("cuisine", "")}
          className={`rounded-full px-3 py-1 text-sm font-medium ${
            activeCuisine === "" ? ACTIVE_CHIP : INACTIVE_CHIP
          }`}
        >
          All cuisines
        </button>
        {CUISINES.map((cuisine) => (
          <button
            key={cuisine.slug}
            type="button"
            onClick={() => updateParam("cuisine", cuisine.slug)}
            className={`rounded-full px-3 py-1 text-sm font-medium ${
              activeCuisine === cuisine.slug ? ACTIVE_CHIP : INACTIVE_CHIP
            }`}
          >
            {cuisine.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <label htmlFor="sort" className="text-sm text-stone-500">
          Sort by
        </label>
        <select
          id="sort"
          value={activeSort}
          onChange={(event) => updateParam("sort", event.target.value)}
          className="rounded-md border border-stone-300 bg-white px-2 py-1 text-sm text-stone-700"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
