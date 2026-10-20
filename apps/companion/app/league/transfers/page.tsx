import { deals } from "@epl/core";
import Ledger from "../../components/league/Ledger";
import Nothing from "../../components/shell/Nothing";
import LeagueShell from "../Shell";
import { readDeals } from "../../business";
import { leagueInfo } from "../../round";
import { named } from "../../components/gazette/named";
import { LEAGUE_CAPTION, titled } from "../../titles";

// Every move in the league on one page, newest first: the team Transfers tab's ledger with each row's mover named,
// read off the same feed, so the two never disagree. Draft's, not Mail's, since 13 Oct 2026.

export const revalidate = 30;

export const metadata = titled(LEAGUE_CAPTION.transfers);

export default async function LeagueTransfersPage() {
  const [info, feed] = await Promise.all([leagueInfo(), readDeals()]);

  // Every team's name by id, the league's and not the rosters': a deal's own copy goes stale when a manager renames.
  const nameOf = named(info?.teams ?? []);
  const all = deals(feed.rows);

  return (
    <LeagueShell current="transfers" teams={info?.teams.length}>
      {all.length === 0 ? <Nothing title="No moves yet" code="0 deals" /> : <Ledger deals={all} nameOf={nameOf} groupByDay />}
    </LeagueShell>
  );
}
