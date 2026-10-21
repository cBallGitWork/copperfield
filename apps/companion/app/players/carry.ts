// What a Data strip link hands the next view: the filters both pool boards read, never a board's own sort, plate or
// page, which name columns the other may not draw. No imports, so the client strip can reach it.

/** The views over one pool, which read the same search, positions, statuses and club. */
const POOL_VIEWS: readonly string[] = ["pool", "stats"];

/** The filters one pool board hands the other. */
const CARRIED = ["q", "pos", "status", "club"] as const;

/** A strip plate's href from the view on screen: the filters ride between the pool's two boards; every other link is bare. */
export function carriedHref(href: string, from: string | null, to: string, search: URLSearchParams): string {
  if (from === null || from === to || !POOL_VIEWS.includes(from) || !POOL_VIEWS.includes(to)) return href;
  const carried = new URLSearchParams();
  for (const name of CARRIED) {
    // The last of a repeated field wins, as `playersQuery` reads it.
    const value = search.getAll(name).at(-1);
    if (value) carried.set(name, value);
  }
  const query = carried.toString();
  return query ? `${href}?${query}` : href;
}
