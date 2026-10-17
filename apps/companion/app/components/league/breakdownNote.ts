/** Why a breakdown has no rows: a total with no parts, or nothing yet, or nothing at all once his match is over. */
export function emptyBreakdownNote(points: number | null, counted: number | null, over: boolean): string {
  if (points) return "No breakdown.";
  // No count stated is none registered.
  const minutes = counted ?? 0;
  if (over) return minutes > 0 ? "Nothing scored for him." : "Did not play.";
  return minutes > 0
    ? "Nothing has scored for him yet."
    : "Nothing has scored for him yet — his minutes have not registered either.";
}
