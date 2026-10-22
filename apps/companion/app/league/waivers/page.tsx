import { FANTRAX_PLAYERS_PATH, deals, lastWaiverRun, ordinal } from "@epl/core";
import Ledger from "../../components/league/Ledger";
import StandingsTable, { StandingsName, type StandingsColumn } from "../../components/league/StandingsTable";
import TeamName from "../../components/league/TeamName";
import Nothing from "../../components/shell/Nothing";
import OutLink from "../../components/shell/OutLink";
import TabStrip from "../../components/shell/TabStrip";
import { FootFrame } from "../../components/shell/FootFrame";
import { BUTTON } from "../../components/shell/ButtonLink";
import { BLOCK_PLATE, QUIET_NOTE } from "../../desk";
import { readDeals } from "../../business";
import { fantraxPage } from "../../fantraxPages";
import { leagueInfo } from "../../round";
import { named } from "../../components/gazette/named";
import { teamHref } from "../../squad/routes";
import { LEAGUE_CAPTION, titled } from "../../titles";
import { readWaivers } from "../../waivers";
import LeagueShell from "../Shell";
import { WAIVERS } from "../routes";
import NextRun from "./NextRun";

// Draft › Waivers: when claims next run, who claims first, and what the last run gave. A view of Transfers, which it
// lights. Under a thumb the order and the last run are one block at a time (`?show=last`); the desk shows both.

export const revalidate = 30;

export const metadata = titled(LEAGUE_CAPTION.waivers);

const ORDER: readonly StandingsColumn<"place">[] = [
  { key: "place", kind: "place", label: "Order", title: "Who claims first: a claim sends its maker to the back", width: "w-8 lg:w-14" },
  { key: "name", kind: "name", label: "Team", title: undefined, width: "" },
];

const BLOCKS = [
  { href: WAIVERS, label: "Claim order", key: "order" },
  { href: `${WAIVERS}?show=last`, label: "Last run", key: "last" },
] as const;

export default async function WaiversPage({ searchParams }: { searchParams: Promise<{ show?: string }> }) {
  const [{ show }, waivers, info, feed] = await Promise.all([searchParams, readWaivers(), leagueInfo(), readDeals()]);
  const shown = show === "last" ? "last" : "order";
  // Every team's name by id: a deal's own copy goes stale when a manager renames.
  const nameOf = named(info?.teams ?? []);
  const run = lastWaiverRun(deals(feed.rows));

  return (
    // Under a thumb the block is picked from the foot, above the thumb rail; the desk shows both and no strip.
    <FootFrame
      foot={
        <div className="lg:hidden">
          <TabStrip label="Waiver views" tabs={BLOCKS} current={shown} labels="word" compact />
        </div>
      }
    >
      <LeagueShell current="waivers" teams={info?.teams.length}>
        <section className="flex flex-col gap-2">
          {/* No schedule read prints nothing: the exit and the blocks still stand. */}
          {waivers.runs.length === 0 ? null : <NextRun runs={waivers.runs} now={waivers.now} />}
          <OutLink href={fantraxPage(FANTRAX_PLAYERS_PATH)} className={`${BUTTON} lg:self-start`}>
            Claim on Fantrax
          </OutLink>
        </section>

        {/* The last run takes two thirds: its ledger holds a date, a team, a type and two names to the order's one. */}
        <div className="grid gap-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
          <section className={`flex flex-col gap-1 ${shown === "order" ? "" : "max-lg:hidden"}`}>
            <h2 className={`${BLOCK_PLATE} max-lg:sr-only`}>Claim order</h2>
            {waivers.order.length === 0 ? (
              <Nothing title="No claim order" code="getStandings → no wwOrder" />
            ) : (
              <StandingsTable
                columns={ORDER}
                lines={waivers.order.map(({ teamId, place }) => ({
                  key: teamId,
                  place: ordinal(place),
                  name: (
                    <StandingsName>
                      <TeamName teamId={teamId} name={nameOf(teamId)} />
                    </StandingsName>
                  ),
                  href: teamHref(teamId),
                  mine: teamId === waivers.mine,
                  values: {},
                }))}
              />
            )}
          </section>

          <section className={`flex flex-col gap-1 ${shown === "last" ? "" : "max-lg:hidden"}`}>
            <h2 className={BLOCK_PLATE}>Last run</h2>
            {run.length === 0 ? (
              <p className={`${QUIET_NOTE} p-2`}>No claims off waivers yet</p>
            ) : (
              <Ledger deals={run} nameOf={nameOf} />
            )}
          </section>
        </div>
      </LeagueShell>
    </FootFrame>
  );
}
