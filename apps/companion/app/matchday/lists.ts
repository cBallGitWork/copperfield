import { type FigureKind, PLACES, rounded, sharedPlaces } from "@epl/core";

// The lists Live's Top stats draws: one figure per man, best first.

/** One man's claim to a place on a list. */
export interface Leader {
  code: number;
  name: string;
  figure: number;
}

export interface Ranked extends Leader {
  rank: number;
}

export interface LeaderList {
  key: string;
  /** The bar over the list; Fantrax's figure says whose it is. */
  title: string;
  head: string;
  /** What the head means, on hover. */
  explain: string;
  /** The kind of figure, which sets its places: a list ranks on the figure it prints, so two who read alike share a place. */
  kind: FigureKind;
  /** The league's points, printed in the reading cyan rather than the lone figure's amber (DESIGN §3). */
  cyan?: true;
}

export const LISTS: readonly LeaderList[] = [
  { key: "xg", title: "Expected goals", head: "xG", explain: "Expected goals", kind: "expected" },
  { key: "xa", title: "Expected assists", head: "xA", explain: "Expected assists", kind: "expected" },
  { key: "points", title: "Fantasy points", head: "FPts", explain: "Fantasy points, under this league's scoring", kind: "count", cyan: true },
];

/** A list's figure ink: FPts the reading cyan, a football figure the amber of one figure beside a name. */
export function figureInk(list: LeaderList): string {
  return list.cyan ? "text-info" : "text-mid";
}

/** A figure held to the places its list prints, so the ranking agrees with what the reader sees. */
export function asPrinted(list: LeaderList, figure: number): number {
  return rounded(figure, PLACES[list.kind]);
}

/** The best `n`, biggest first and then by name; a nought earns no place, and level figures share one. */
export function ranked(leaders: readonly Leader[], n: number): Ranked[] {
  const sorted = leaders
    .filter((leader) => leader.figure > 0)
    .sort((a, b) => b.figure - a.figure || a.name.localeCompare(b.name));
  const top = sorted.slice(0, n);
  const ranks = sharedPlaces(top, (above, leader) => above.figure === leader.figure);
  return top.map((leader, at) => ({ ...leader, rank: ranks[at] }));
}
