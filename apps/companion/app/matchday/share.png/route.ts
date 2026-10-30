import { roundState, type LiveTeamScore } from "@epl/core";
import { now } from "../../clock";
import { PAGE_REVALIDATE } from "../../config";
import { liveNow } from "../../football";
import { roundTies } from "../../league/fixtures/roundTies";
import { placings } from "../../league/placings";
import { liveScores } from "../../scoreboard";
import { getLeagueSquads, readable } from "../../squads";
import { leagueTable } from "../../standings";
import { roundOf } from "../../round";
import { shareList } from "../shareList";
import { shareListCard } from "../shareListCard";

// `/matchday/share.png`: Live's league list as a picture for the group chat, the same for every reader so it caches.

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  const [snapshot, table] = await Promise.all([liveNow(), leagueTable()]);
  const squads = await getLeagueSquads(await roundOf(snapshot.gameweek));
  const drafted = readable(squads);
  const period = drafted?.roundPeriod ?? null;
  const { scores, fetchedAt } =
    period === null ? { scores: new Map<string, LiveTeamScore>(), fetchedAt: null } : await liveScores(period);
  // The same ties as Live's list: the league's pairings, then our cups.
  const ties =
    drafted?.info != null && period !== null
      ? roundTies(drafted.info, { gameweek: snapshot.gameweek, period })
      : [];
  const list = shareList({
    ties,
    scores,
    places: placings(table),
    gameweek: snapshot.gameweek,
    state: roundState(snapshot, now().toISOString()),
    takenAt: fetchedAt ?? now().toISOString(),
  });
  const png = await (await shareListCard(list)).arrayBuffer();
  return new Response(png, {
    headers: {
      "Content-Type": "image/png",
      // It moves with the scores: as long as a page's own revalidate, and no longer.
      "Cache-Control": `public, max-age=${PAGE_REVALIDATE}, s-maxage=${PAGE_REVALIDATE}`,
    },
  });
}
