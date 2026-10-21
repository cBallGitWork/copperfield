import { initialled } from "@epl/core";
import { careerOf } from "./pastSides";
import type { Sides } from "./pick";
import { openingB, type CompareRoute } from "./compareRoute";
import { subject } from "../[fantraxId]/subject";
import type { LeaguePool } from "../pool";
import { lastValue } from "../routes";

// The reads that settle who Compare's sides are before either is drawn.

/** The page's query as Next hands it. */
export type Asked = Record<string, string | string[] | undefined>;

type Read = Awaited<ReturnType<typeof subject>>;

/** The sides the URL names; on his own Compare A is the path's, and B opens as `openingB` says when none is named. */
export async function askedSides(asked: Asked, route: CompareRoute, rival: string | undefined): Promise<Sides> {
  const url = {
    a: lastValue(asked.a),
    b: lastValue(asked.b),
    qa: lastValue(asked.qa) ?? "",
    qb: lastValue(asked.qb) ?? "",
    as: lastValue(asked.as),
    bs: lastValue(asked.bs),
  };
  if (route.fixed === undefined) return url;
  // His career only when B is his to open: the same cached reads the page makes next.
  const career = url.b === undefined && url.bs === undefined ? await careerOf(found(await subject(route.fixed))) : null;
  return { ...url, a: route.fixed, qa: "", ...openingB(url, route.fixed, career, rival) };
}

/** The rival with the name his button prints, off the pool row. */
export function rivalNamed(pool: LeaguePool, id: string | undefined): { id: string; name: string } | undefined {
  const row = id === undefined || "unavailable" in pool ? undefined : pool.rows.find((each) => each.entry.player.fantraxId === id);
  return row === undefined ? undefined : { id: row.entry.player.fantraxId, name: initialled(row.entry.player.displayName) };
}

/** A side that answered, or null. */
export function found(side: Read | null) {
  return side !== null && !("unavailable" in side) ? side : null;
}

/** The tell from a side that refused, or null. */
export function refusal(side: Read | null): string | null {
  return side !== null && "unavailable" in side ? side.unavailable : null;
}
