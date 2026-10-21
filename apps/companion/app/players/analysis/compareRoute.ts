import type { PastSeason } from "@epl/core";
import { ANALYSIS, compareHref, playerCompareHref, seasonValue, type CompareField } from "../routes";
import { lastSeason, pickedSeason } from "./season";

// Where Compare lives: Data's page with both men in the query, or a player's own tab with him fixed as A in the path.

export interface CompareRoute {
  /** The page every link and form on it goes back to. */
  base: string;
  /** The man the path fixes as A, or undefined on Data's page where either side is picked. */
  fixed: string | undefined;
}

/** Data's Compare. */
export const DATA_COMPARE: CompareRoute = { base: ANALYSIS, fixed: undefined };

/** One player's own Compare. */
export function playerCompare(fantraxId: string): CompareRoute {
  return { base: playerCompareHref(fantraxId), fixed: fantraxId };
}

/** A link on this Compare: a fixed A is the path's, so the query never carries `a`. */
export function routeHref(route: CompareRoute, fields: Partial<Record<CompareField, string>>): string {
  return compareHref(route.fixed === undefined ? fields : { ...fields, a: undefined }, route.base);
}

/** B on a player's own Compare: as asked; himself in `bs` when only a season is named; else his last season other
 *  than A's (Craig, 21 Oct 2026), and the nearest rival for a man with none. */
export function openingB(
  asked: { b: string | undefined; as: string | undefined; bs: string | undefined },
  self: string,
  career: readonly PastSeason[] | null,
  rival: string | undefined,
): { b: string | undefined; bs: string | undefined } {
  if (asked.b !== undefined) return { b: asked.b, bs: asked.bs };
  if (asked.bs !== undefined) return { b: self, bs: asked.bs };
  const last = lastSeason(career, pickedSeason(asked.as, career)?.season ?? null);
  return last === null ? { b: rival, bs: undefined } : { b: self, bs: seasonValue(last.season) };
}

/** A one-tap B under B's select: "v his last season", "v E. Haaland". */
export interface Opening {
  label: string;
  href: string;
}

/** B's one-tap openings: his own last season (`last`, as the URL carries it) when B is not it already, Data's page
 *  only while B is empty or A again; on his own Compare the rival too, unless B is him. */
export function openingsOf(
  route: CompareRoute,
  on: { a: string; as: string | undefined; b: string | undefined; bs: string | undefined; view: string | undefined },
  last: string | undefined,
  rival: { id: string; name: string } | undefined,
): Opening[] {
  const self =
    route.fixed === undefined
      ? on.b === undefined || (on.b === on.a && (on.bs ?? "") === (on.as ?? ""))
      : !(on.b === on.a && on.bs === last);
  const keep = { a: on.a, as: on.as, view: on.view };
  return [
    ...(last !== undefined && self ? [{ label: "v his last season", href: routeHref(route, { ...keep, b: on.a, bs: last }) }] : []),
    ...(rival !== undefined && on.b !== rival.id ? [{ label: `v ${rival.name}`, href: routeHref(route, { ...keep, b: rival.id }) }] : []),
  ];
}
