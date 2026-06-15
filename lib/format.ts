/** Round to 1 decimal place and strip a trailing ".0" (e.g. 226.8, 2, 0.5). */
export function formatAmount(amount: number): string {
  const rounded = Math.round(amount * 10) / 10;
  return rounded % 1 === 0 ? String(rounded) : rounded.toFixed(1);
}
