import { Suspense } from "react";
import { clubById, seasonKey } from "@epl/core";
import type { Club, FootballPlayer, PastSeason, PlayerMatch } from "@epl/core";
import Nothing from "../../../components/shell/Nothing";
import { LABEL, PANEL } from "@/app/desk";
import { footballNow, seasonFixtures } from "../../../football";
import { playerMarks } from "../../../ratings";
import { intelCareers, intelShots, intelTouches } from "../../../intel";
import { pastMaps } from "../../../pastMaps";
import { UNAVAILABLE } from "../../../config";
import QuerySelect from "../../../components/shell/QuerySelect";
import { ALL_SEASONS, playerDataHref, seasonValue } from "../../routes";
import MatchLog from "../MatchLog";
import PastSeasons from "../PastSeasons";
import SeasonMaps from "../SeasonMaps";
import HeldNote from "../HeldNote";
import NoProfile from "../NoProfile";
import PlayerShell from "../PlayerShell";
import { TableWaiting } from "../Waiting";
import { pastSeasons, playerStanding } from "../grid";
import { pastSeasonMaps, seasonMaps } from "../maps";
import { joinMatches, totalsOf } from "../matchRows";
import type { MatchRow } from "../matchRows";
import { gameLog } from "../scouting";
import { subject } from "../subject";
import { getLeaguePool } from "../../pool";
import { poolPoints } from "../poolPoints";
import { playerTitle } from "../title";

// His record a season at a time (Craig, 25 Sep 2026): this season's every match with its total and rank, then his maps, by default;
// a past season's line and maps, or every season with his club. The old History route sends a reader to "All seasons".

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
  const maps = <SeasonMaps maps={seasonMaps(player.code, intelShots, intelTouches, standing.keeper)} club={club} />;
  // One FPL read feeds both; when it will not answer, say so rather than print half a career. His season's foot and
  // his maps read no game log, so they stand while it is silent.
  if (past === null || log === null) {
    return (
      <>
        <Nothing title={UNAVAILABLE} code="element-summary" />
        {chosen === "" ? (
          <>
            <MatchLog rows={[]} standing={standing} />
            {maps}
          </>
        ) : null}
      </>
    );
  }
  const byId = clubById(snapshot);
  const joined = joinMatches(log.rows, paid, byId, playerMarks(player.code, fixtures));
  const league = [...byId.values()];
  const clubs = intelCareers.get(player.code) ?? new Map<string, string>();
  const label = season ?? "This season";
  const options = [
    { value: "", label },
    ...past.map((row) => ({ value: seasonValue(row.season), label: row.season })),
    { value: ALL_SEASONS, label: "All seasons" },
  ];
  const value = options.some((option) => option.value === chosen) ? chosen : "";
  const picked = past.find((row) => seasonValue(row.season) === value);
  // Only the picked season's file is read; a season with none, or nothing for him, draws no maps.
  const before = picked ? await pastMaps(seasonKey(picked.season), player.code) : null;

  return (
    <>
      <section className={`${PANEL} lg:flex-row lg:items-center`}>
        {/* A past season's table heads itself, so the select's aria-label names it there. */}
        {value === "" ? <span className={LABEL}>Season</span> : null}
        <div className="lg:w-64">
          <QuerySelect name="season" label="Season" value={value} options={options} action={playerDataHref(fantraxId)} />
        </div>
      </section>
      {value === ALL_SEASONS ? (
        <PastSeasons seasons={past} current={thisSeason(joined, label)} clubs={clubs} league={league} />
      ) : picked ? (
        <>
          <PastSeasons seasons={[picked]} clubs={clubs} league={league} />
          {before === null ? null : (
            // A plain plate: the season's own club is a name in the table above, and his club now may not be it.
            <SeasonMaps maps={pastSeasonMaps(before, standing.keeper)} club={undefined} season={picked.season} />
          )}
        </>
      ) : (
        <>
          {log.heldAt === null ? null : <HeldNote at={log.heldAt} />}
          <MatchLog rows={joined} standing={standing} />
          {maps}
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
