/** His lines in the roster's order, the Squad tab's; a man the roster lacks keeps the read's order at the foot. */
export function rosterOrder<T extends { fantraxId: string }>(lines: readonly T[], roster: readonly string[]): T[] {
  const place = new Map(roster.map((id, index) => [id, index]));
  const at = (line: T) => place.get(line.fantraxId) ?? roster.length;
  return [...lines].sort((a, b) => at(a) - at(b));
}
