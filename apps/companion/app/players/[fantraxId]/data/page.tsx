import { Suspense } from "react";
import { clubById } from "@epl/core";
import type { Club, FootballPlayer, PastSeason, PlayerMatch } from "@epl/core";
import Nothing from "../../../components/shell/Nothing";
import { LABEL, PANEL } from "@/app/desk";
import { footballNow, seasonFixtures } from "../../../football";
import { playerMarks } from "../../../ratings";
import { intelCareers, intelShots, intelTouches } from "../../../intel";
import { UNAVAILABLE } from "../../../config";
import QuerySelect from "../../../components/shell/QuerySelect";
import { ALL_SEASONS, playerDataHref } from "../../routes";
import MatchLog from "../MatchLog";
import PastSeasons from "../PastSeasons";
import Rankings from "../Rankings";
import SeasonMaps from "../SeasonMaps";
import HeldNote from "../HeldNote";
import NoProfile from "../NoProfile";
import PlayerShell from "../PlayerShell";
import { TableWaiting } from "../Waiting";
import { pastSeasons, playerStanding } from "../grid";
import { seasonMaps } from "../maps";
import { joinMatches, totalsOf } from "../matchRows";
import type { MatchRow } from "../matchRows";
import { gameLog } from "../scouting";
import { subject } from "../subject";
import { getLeaguePool } from "../../pool";
import { poolPoints } from "../poolPoints";
import { playerTitle } from "../title";

// His record a season at a time (Craig, 25 Sep 2026): this season's tables, rankings, maps and every match by default,
// a past season's line, or every season with his club. The old History route sends a reader to "All seasons".

export const revalidate = 30;

export const generateMetadata = playerTitle("data");

export default async function PlayerData({
  params,
  searchParams,
}: {
  params: Promise<{ fantraxId: string }>;
  searchParams: Promise<{ season?: string }>;
}) {
  const [{ fantraxId }, { season: chosen = "" }] = await Promise.all([params, searchParams]);
  const found = await subject(fantraxId);
  if ("unavailable" in found) return <NoProfile code={found.unavailable} />;

  const { intel, football } = found;

  return (
    <PlayerShell subject={found} fantraxId={fantraxId} current="data">
      {football === null ? (
        <section className={PANEL}>
          <Nothing title="No record for this man" />
        </section>
      ) : (
        <Suspense fallback={<TableWaiting />}>
          <Record
            player={football.player}
            club={football.club}
            fantraxId={fantraxId}
            chosen={chosen}
            paid={intel.matches}
            season={intel.season}
          />
        </Suspense>
      )}
    </PlayerShell>
  );
}

/** The picker and the season it picks, behind one boundary: the reads are shared. */
async function Record({
  player,
  club,
  fantraxId,
  chosen,
  paid,
  season,
}: {
  player: FootballPlayer;
  club: Club | undefined;
  fantraxId: string;
  chosen: string;
  paid: PlayerMatch[];
  season: string | null;
}) {
  const [past, log, snapshot, fixtures, standing] = await Promise.all([
    pastSeasons(player),
    gameLog(player),
    footballNow(),
    seasonFixtures(),
    getLeaguePool().then((pool) => playerStanding(player, poolPoints(pool))),
  ]);
  // His place and his maps read no FPL, so they stand while it is silent.
  const measured = (
    <>
      <Rankings ranked={standing.ranked} fpts={standing.fpts} group={standing.group} />
      <SeasonMaps maps={seasonMaps(player.code, intelShots, intelTouches, standing.keeper)} club={club} />
    </>
  );
  // One FPL read feeds both; when it will not answer, say so rather than print half a career.
  if (past === null || log === null) {
    return (
      <>
        <Nothing title={UNAVAILABLE} code="element-summary" />
        {chosen === "" ? measured : null}
      </>
    );
  }
  const joined = joinMatches(log.rows, paid, clubById(snapshot), playerMarks(player.code, fixtures));
  const clubs = intelCareers.get(player.code) ?? new Map<string, string>();
  const label = season ?? "This season";
  const options = [
    { value: "", label },
    ...past.map((row) => ({ value: row.season.replace("/", "-"), label: row.season })),
    { value: ALL_SEASONS, label: "All seasons" },
  ];
  const value = options.some((option) => option.value === chosen) ? chosen : "";
  const picked = past.find((row) => row.season.replace("/", "-") === value);

  return (
    <>
      <section className={`${PANEL} lg:flex-row lg:items-center`}>
        <span className={LABEL}>Season</span>
        <div className="lg:w-64">
          <QuerySelect name="season" label="Season" value={value} options={options} action={playerDataHref(fantraxId)} />
        </div>
      </section>
      {value === ALL_SEASONS ? (
        <PastSeasons seasons={past} current={thisSeason(joined, label)} clubs={clubs} />
      ) : picked ? (
        <PastSeasons seasons={[picked]} clubs={clubs} />
      ) : (
        <>
          {log.heldAt === null ? null : <HeldNote at={log.heldAt} />}
          {measured}
          <MatchLog rows={joined} />
        </>
      )}
    </>
  );
}

/** This season as one line of the career table, or null before he has played. */
function thisSeason(rows: readonly MatchRow[], season: string): PastSeason | null {
  const t = totalsOf(rows);
  if (t.minutes === 0) return null;
  return {
    season,
    minutes: t.minutes,
    goals: t.goals,
    assists: t.assists,
    cleanSheets: t.cleanSheets,
    goalsConceded: t.conceded,
    yellowCards: t.yellowCards,
    redCards: t.redCards,
    saves: t.saves,
    fplPoints: t.fplPoints,
  };
}
