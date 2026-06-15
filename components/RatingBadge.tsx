export function RatingBadge({ score }: { score: number | null }) {
  if (score === null) {
    return null;
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-sm font-medium text-amber-800">
      <span aria-hidden="true">★</span>
      {Math.round(score)}
    </span>
  );
}
