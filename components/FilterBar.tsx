"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CUISINES, MEAL_TYPES, SORT_OPTIONS } from "@/lib/constants";

export function FilterBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const activeCuisine = searchParams.get("cuisine") ?? "";
  const activeMealType = searchParams.get("mealType") ?? "";
  const activeSort = searchParams.get("sort") ?? "rating";

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
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => updateParam("mealType", "")}
          className={`rounded-full px-3 py-1 text-sm font-medium ${
            activeMealType === "" ? "bg-amber-600 text-white" : "bg-black/5 text-black/70"
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
              activeMealType === mealType.slug
                ? "bg-amber-600 text-white"
                : "bg-black/5 text-black/70"
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
            activeCuisine === "" ? "bg-amber-600 text-white" : "bg-black/5 text-black/70"
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
              activeCuisine === cuisine.slug
                ? "bg-amber-600 text-white"
                : "bg-black/5 text-black/70"
            }`}
          >
            {cuisine.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <label htmlFor="sort" className="text-sm text-black/60">
          Sort by
        </label>
        <select
          id="sort"
          value={activeSort}
          onChange={(event) => updateParam("sort", event.target.value)}
          className="rounded-md border border-black/10 bg-white px-2 py-1 text-sm"
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
