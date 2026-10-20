/** Mail items this device has not seen; none before its first visit, so a new reader starts at nought, not 9+. */
export function unreadCount(ids: readonly string[], seen: ReadonlySet<string> | null): number {
  return seen === null ? 0 : ids.filter((id) => !seen.has(id)).length;
}

/** The badge's figure, capped at two characters so it stays inside a 320 tab. */
export function unreadText(count: number): string {
  return count > 9 ? "9+" : String(count);
}

/** Whether to store the inbox as seen: on Mail or a first visit, and never from a failed read (`null`). */
export function shouldRecord(ids: readonly string[] | null, reading: boolean, firstVisit: boolean): ids is readonly string[] {
  return ids !== null && (reading || firstVisit);
}
