import { squadOf } from "@epl/core";
import TabEmpty from "../../../../components/league/TabEmpty";
import TabStrip from "../../../../components/shell/TabStrip";
import { clubHref } from "../../../routes";
import ClubShell from "../Shell";
import { clubOr404 } from "../club";
import { leagueOpinions } from "../../../leagueOpinions";
import { poolHref } from "../../../poolHref";
import { squadOrder } from "../squadOrder";
import { intelSquads } from "../../../../intel";
import PlayerBoard from "./PlayerBoard";
import type { Row } from "./PlayerBoard";
import { VIEWS, viewOf } from "./measures";
import { clubTitle } from "../title";

// The club's season, player by player, as a sortable table like every other Stats tab (Craig, 3 Sep 2026).
// Meant to open in the Squad tab's order: two tabs about one squad should not disagree about who is first.

// Must equal PAGE_REVALIDATE in config.ts: Next reads it statically, so it cannot be imported.
export const revalidate = 30;

export const generateMetadata = clubTitle("stats");

export default async function ClubStatsPage({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ view?: string }>;
}) {
  const [{ code }, query] = await Promise.all([params, searchParams]);
  const view = viewOf(query.view).key;
  const [{ club, snapshot }, league] = await Promise.all([clubOr404(code), leagueOpinions()]);

  const rows: Row[] = squadOf(snapshot, club.id)
    .sort(squadOrder(league, (code) => intelSquads.get(code)?.depthTier))
    .map((player) => ({
      player,
      positions: league.get(player.code)?.positions ?? [],
      href: poolHref(league, player.code),
    }));

  return (
    <ClubShell
      club={club}
      current="stats"
      empty={rows.length === 0 ? ["stats"] : []}
      foot={rows.length === 0 ? undefined : <Views code={club.code} view={view} />}
    >
      {/* Keyed on the view, so a sort by a column the next view lacks does not follow it there. */}
      {rows.length === 0 ? <TabEmpty>No squad listed.</TabEmpty> : <PlayerBoard key={view} rows={rows} view={view} />}
    </ClubShell>
  );
}

/** The board's three views, a link each, so a shared link and the way back from a player keep the one chosen. */
function Views({ code, view }: { code: number; view: string }) {
  return (
    <TabStrip
      label="Stats views"
      tabs={VIEWS.map((entry) => ({ key: entry.key, label: entry.label, href: `${clubHref(code)}/stats?view=${entry.key}` }))}
      current={view}
      labels="word"
    />
  );
}
