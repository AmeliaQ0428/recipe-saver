export function SearchBar({
  defaultValue = "",
  className = "",
}: {
  defaultValue?: string;
  className?: string;
}) {
  return (
    <form action="/search" method="GET" className={`flex ${className}`}>
      <input
        type="search"
        name="q"
        defaultValue={defaultValue}
        placeholder="Search recipes…"
        className="w-full rounded-l-full border border-stone-300 bg-white px-4 py-2 text-sm text-stone-800 placeholder:text-stone-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
      />
      <button
        type="submit"
        className="rounded-r-full border border-l-0 border-amber-600 bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-700"
      >
        Search
      </button>
    </form>
  );
}
