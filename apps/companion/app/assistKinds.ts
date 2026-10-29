import { unstable_cache } from "next/cache";
import {
  type AssistKinds,
  OUTFIELD,
  POOL_PAGE_SIZE,
  fetchPoolStats,
  fplCodeOf,
  mapAssistKinds,
  mapPlayerStats,
  periodHoldingGameweek,
} from "@epl/core";
import { ASSIST_KINDS_REVALIDATE } from "./config";
import { seasonKickoffs } from "./football";
import { orDegraded, refusedAs } from "./refusals";
import { bridge } from "./squads";
import { STATS_LEAGUE, periodsOf } from "./statsLeague";

// The stats league's typed fantasy assists for a gameweek, keyed by FPL code. Outfield only: the
// keepers' table carries no kinds. Nothing when the league is unnamed or silent; a bug of ours still throws.

/** One period's kinds in a league, as entries, since a Map does not survive the cache. */
const kindsOf = unstable_cache(
  (league: string, period: number): Promise<[number, AssistKinds][]> =>
    refusedAs(fetchPoolStats(league, POOL_PAGE_SIZE, undefined, OUTFIELD, period), () => [], (raw) =>
      mapAssistKinds(mapPlayerStats(raw)).flatMap(({ fantraxId, kinds }): [number, AssistKinds][] => {
        const code = fplCodeOf(bridge, fantraxId);
        return code === null ? [] : [[code, kinds]];
      }),
    ),
  ["assist-kinds"],
  { revalidate: ASSIST_KINDS_REVALIDATE },
);

export async function roundAssistKinds(gameweek: number | null): Promise<Map<number, AssistKinds>> {
  if (gameweek === null || STATS_LEAGUE === null) return new Map();
  const kinds = async (league: string) => {
    const [periods, kickoffs] = await Promise.all([periodsOf(league), seasonKickoffs()]);
    const period = periodHoldingGameweek(periods, kickoffs, gameweek)?.period;
    return new Map(period === undefined ? [] : await kindsOf(league, period));
  };
  return orDegraded(kinds(STATS_LEAGUE), () => new Map<number, AssistKinds>());
}
