export function RatingBadge({
  score,
  overlay = false,
}: {
  score: number | null;
  overlay?: boolean;
}) {
  if (score === null) {
    return null;
  }

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-sm font-semibold ${
        overlay
          ? "bg-white/90 text-amber-700 shadow-sm backdrop-blur"
          : "bg-amber-100 text-amber-800"
      }`}
    >
      <span aria-hidden="true" className="text-amber-500">
        ★
      </span>
      {Math.round(score)}
    </span>
  );
}
