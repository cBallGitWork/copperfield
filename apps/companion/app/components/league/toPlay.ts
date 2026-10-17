/** A side's men still to play, in words: "2 to play"; "all played" only while the round runs, when it says something. */
export function toPlayWord(toPlay: number | null | undefined, underway: boolean): string | null {
  // Zero is a statement, so the number is read, not its truthiness.
  if (toPlay == null) return null;
  if (toPlay > 0) return `${toPlay} to play`;
  return underway ? "all played" : null;
}
