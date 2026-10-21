// The Data section's routes, in a module with no imports so a client component can reach one without the column table.

/** One value of a query parameter Next may hand as an array: the last wins, as a browser's does. */
export function lastValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[value.length - 1] : value;
}

/** The board, and the stem a player's own page hangs off — `${POOL}/{fantraxId}`. */
export const POOL = "/players";

/** One player's own page, the stem his tabs hang off. */
export function playerHref(fantraxId: string): string {
  return `${POOL}/${fantraxId}`;
}

/** The value of Data's season picker that shows every season with its club. */
export const ALL_SEASONS = "all";

/** A completed season's label as a URL carries it, on Data and Compare: "2024/25" is "2024-25". */
export function seasonValue(label: string): string {
  return label.replace("/", "-");
}

/** One player's record, at a season the picker offers: `""` is this season, `ALL_SEASONS` every one. */
export function playerDataHref(fantraxId: string, season = ""): string {
  return season === "" ? `${playerHref(fantraxId)}/data` : `${playerHref(fantraxId)}/data?season=${season}`;
}

/** One player's news, with one story open when `story` names it. */
export function playerNewsHref(fantraxId: string, story?: string): string {
  const list = `${playerHref(fantraxId)}/news`;
  return story === undefined ? list : `${list}?story=${encodeURIComponent(story)}`;
}

/** Two players side by side, `?a=&b=`. */
export const ANALYSIS = `${POOL}/analysis`;

/** Compare's query: the men, the boxes' searches, the view and range, and each side's completed season ("2024-25"). */
export type CompareField = "a" | "b" | "qa" | "qb" | "view" | "range" | "as" | "bs";

/** Compare, carrying each field given a value in the order given. */
export function compareHref(fields: Partial<Record<CompareField, string>>): string {
  const query = new URLSearchParams();
  for (const [name, value] of Object.entries(fields)) if (value !== undefined && value !== "") query.set(name, value);
  const search = query.toString();
  return search === "" ? ANALYSIS : `${ANALYSIS}?${search}`;
}

/** Adv Stats: the same pool under every figure the league does not score (Craig, 16 Oct 2026). */
export const STATS = `${POOL}/stats`;

/** Data's club board: every real club as a fantasy manager reads it. */
export const TEAMS = `${POOL}/teams`;

/** The fixture planner: every club's next six opponents, ranked by our strength model. */
export const PLANNER = `${POOL}/planner`;
