import type { ReactNode } from "react";
import { seasonForm, sortRows, londonDayAndTime, kickoffAt, playerName, printedPlaces, DASH } from "@epl/core";
import type { Club, Fixture, LeagueTeam, LineupDetail, RosteredTeam } from "@epl/core";
import { fixtureInvolvement } from "@epl/core";
import { teamColours } from "@/app/teamColours";
import { seasonFixtures } from "../../../football";
import ScoreRow from "../../../components/shell/ScoreRow";
import MatchClock from "../../../components/football/MatchClock";
import { scoreSide } from "../../../components/football/scoreSide";
import { byKickoff, menByEnd, type PlacedMan } from "./fixtureMen";
import { COLUMNS, leagueLine, leagueSortHref } from "../../Columns";
import StandingsTable from "../../../components/league/StandingsTable";
import { getSeasonResults } from "../../schedule/schedule";
import { leagueTable } from "../../../standings";
import { leagueInfo, readCalendar } from "../../../round";
import Nothing from "../../../components/shell/Nothing";
import { PANEL } from "@/app/desk";
import { matchHref } from "../../../prem/match/[id]/matchRoutes";
import { clubPlaces } from "../../../prem/places";

// The two boards that place this tie rather than explain it: the league it sits in, and the football it is
// being played out in.

/** The league table itself (Craig, 11 Sep 2026), both sides of the tie edged in their own colours, as on the scoreline;
 *  `mine` keeps its one meaning. */
export async function TableTab({ tie, mine }: { tie: readonly string[]; mine: string | null }) {
  const [rows, info, results, calendar] = await Promise.all([
    leagueTable(),
    leagueInfo(),
    getSeasonResults(),
    readCalendar(),
  ]);

  if ("unavailable" in rows || rows.length === 0) {
    return (
      <section className={PANEL}>
        <Nothing title="No table yet" />
      </section>
    );
  }

  const form = new Map(
    seasonForm(rows, info?.matchups ?? [], results).map((team) => [team.teamId, team.run]),
  );
  const places = printedPlaces(rows);

  return (
    <section className={PANEL}>
      <StandingsTable
        columns={COLUMNS}
        sort="rank"
        sortHref={leagueSortHref("rank", false)}
        lines={sortRows(rows, "rank", false).map((row) =>
          leagueLine(row, {
            places,
            mine,
            form,
            calendar,
            tint: tie.includes(row.teamId) ? teamColours(row.teamId).primary : undefined,
          }),
        )}
      />
    </section>
  );
}

/** Every real match either squad has a man in, as the Live tab draws a fixture (`ScoreRow`), each man and his
 *  Fantrax points under his own club, chipped in his manager's colour. A side whose eleven is not public names nobody. */
export async function FixturesTab({
  fixtures,
  sides,
  snapshotClubs,
  withheld,
  kicked,
}: {
  fixtures: readonly Fixture[];
  sides: readonly { team: LeagueTeam; roster: RosteredTeam | undefined; detail: LineupDetail | undefined }[];
  snapshotClubs: readonly Club[];
  withheld: ReactNode;
  /** Before kickoff the men are names alone: nobody has a figure yet. */
  kicked: boolean;
}) {
  const clubs = new Map(snapshotClubs.map((club) => [club.id, club]));
  // A club's place in the real table, for each row's blue blocks, as the Live tab sets them.
  const places = clubPlaces(await seasonFixtures(), snapshotClubs);
  const involved = sides.map(({ roster }) => (roster === undefined ? new Map() : fixtureInvolvement(roster, fixtures)));
  const chips = sides.map(({ team }) => ({ name: team.name, colour: teamColours(team.teamId).primary }));
  const ours = byKickoff(fixtures.filter((f) => involved.some((byFixture) => (byFixture.get(f.id) ?? []).length > 0)));

  if (ours.length === 0) {
    return (
      <section className={PANEL}>
        <Nothing title="No matches yet" />
      </section>
    );
  }

  return (
    <section className={PANEL}>
      {withheld}
      <ul className="cm-rows flex flex-col">
        {ours.map((fixture) => (
          <li key={fixture.id} className="flex flex-col">
            <ScoreRow
              home={scoreSide(clubs.get(fixture.homeClubId), places)}
              away={scoreSide(clubs.get(fixture.awayClubId), places)}
              score={
                fixture.homeScore === null || fixture.awayScore === null
                  ? null
                  : { home: fixture.homeScore, away: fixture.awayScore }
              }
              pending={kickoffAt(fixture.kickoff, londonDayAndTime)}
              clock={<MatchClock fixture={fixture} />}
              href={matchHref(fixture.id, "overview")}
            />
            <Ends ends={menByEnd(sides.map(({ detail }) => detail), fixture.id)} chips={chips} kicked={kicked} />
          </li>
        ))}
      </ul>
    </section>
  );
}

/** A match's men under their clubs, home left and away right against the centre rule; nothing when nobody shows. */
function Ends({
  ends,
  chips,
  kicked,
}: {
  ends: { home: PlacedMan[]; away: PlacedMan[] };
  chips: readonly { name: string; colour: string }[];
  kicked: boolean;
}) {
  if (ends.home.length + ends.away.length === 0) return null;
  return (
    <div className="grid grid-cols-2 divide-x divide-line bg-surface">
      <Men men={ends.home} end chips={chips} kicked={kicked} />
      <Men men={ends.away} end={false} chips={chips} kicked={kicked} />
    </div>
  );
}

/** One club's men in one match, each chipped in his manager's colour; a reserve is dimmed, his figure uncounted. */
function Men({
  men,
  end,
  chips,
  kicked,
}: {
  men: readonly PlacedMan[];
  end: boolean;
  chips: readonly { name: string; colour: string }[];
  kicked: boolean;
}) {
  return (
    <ul className="flex min-w-0 flex-col py-1">
      {men.map(({ player, reserve, scored, side }) => (
        <li
          key={player.rostered.slot.fantraxId}
          className={`flex min-w-0 items-center gap-1.5 px-2 py-0.5 text-sm ${end ? "flex-row-reverse text-right" : ""} ${reserve ? "text-muted" : ""}`}
          title={reserve ? "On the bench: not counted" : undefined}
        >
          <span aria-label={chips[side]?.name} role="img" className="h-3 w-1.5 shrink-0" style={{ background: chips[side]?.colour }} />
          {kicked ? (
            <span className={`numeric w-6 shrink-0 text-center ${reserve ? "" : "text-info"}`}>
              {scored && player.points != null ? player.points : DASH}
            </span>
          ) : null}
          <span className="min-w-0 truncate font-chrome font-bold">{playerName(player.rostered)}</span>
        </li>
      ))}
    </ul>
  );
}
