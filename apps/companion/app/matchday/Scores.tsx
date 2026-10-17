import {
  COMPETITION_NAME,
  LEAGUE_COMPETITION,
  LEAGUE_NAME,
  type Club,
  type CompetitionTie,
  type Fixture,
  type LiveTeamScore,
  groupTies,
} from "@epl/core";
import ScoreRow from "../components/shell/ScoreRow";
import Section from "../components/shell/Section";
import FootballRow from "./FootballRow";
import GoalNotes from "./GoalNotes";
import type { FixtureGoals } from "./fixtureGoals";
import { opensOn, tieSide } from "../components/league/tieSide";
import { toPlayWord } from "../components/league/toPlay";
import { tieHref } from "@/app/league/routes";

// Both competitions in Championship Manager's results row, the football first (Craig, 21 Sep 2026).

/** One league or cup tie; a side not yet drawn has no id or link and prints its label. */
function DraftRow({
  tie,
  scores,
  places,
  mine,
  gameweek,
}: {
  tie: CompetitionTie;
  scores: Map<string, LiveTeamScore>;
  /** Each manager's place in our table, by team id: CM's blue block. */
  places: Map<string, string>;
  mine: string | null;
  gameweek: number;
}) {
  const on = opensOn(tie.home.team?.teamId, tie.away.team?.teamId, mine);
  // Only league ties open a board: the head-to-head route reads Fantrax's schedule,
  // so a cup tie would open those two teams' league match instead.
  const opens = tie.competition.id === LEAGUE_COMPETITION.id && on !== undefined;
  // Scores render only while the gameweek runs, so "all played" says something here.
  const left = (teamId: string | undefined) => ({ left: toPlayWord(scores.get(teamId ?? "")?.toPlay, true) });

  return (
    <ScoreRow
      home={tieSide(tie.home, places, mine, left(tie.home.team?.teamId))}
      away={tieSide(tie.away, places, mine, left(tie.away.team?.teamId))}
      // No `pending`: a fantasy total has no kick-off, and a missing one prints the dash.
      score={{ home: pointsOf(tie.home.team?.teamId, scores), away: pointsOf(tie.away.team?.teamId, scores) }}
      // No tail: a fantasy tie has no minute, and the accent edge and name already mark yours.
      href={opens ? tieHref(on, gameweek, tie.home.team?.teamId, tie.away.team?.teamId) : undefined}
    />
  );
}

export function Scores({
  ties,
  scores,
  places,
  clubPlaces,
  mine,
  fixtures,
  clubs,
  now,
  gameweek,
  asOf,
  goals,
}: {
  ties: readonly CompetitionTie[];
  scores: Map<string, LiveTeamScore>;
  /** Our league's table, by team id. */
  places: Map<string, string>;
  /** The real one, by club id. */
  clubPlaces: Map<number, number>;
  mine: string | null;
  fixtures: readonly Fixture[];
  clubs: Map<number, Club>;
  now: boolean;
  gameweek: number;
  /** The time of scores kept through a failed refresh; null while they are current. */
  asOf: string | null;
  /** Each match's goals by fixture id, none for a match without one. */
  goals: Map<number, FixtureGoals>;
}) {
  return (
    <>
      {/* Headed, so the rows name their competition (Craig, 21 Sep 2026). */}
      <Section title={COMPETITION_NAME}>
        <ul className="cm-rows">
          {fixtures.map((f) => {
            const scored = goals.get(f.id);
            return (
              <li key={f.id}>
                <FootballRow fixture={f} clubs={clubs} places={clubPlaces} now={now} />
                {scored === undefined ? null : <GoalNotes goals={scored} />}
              </li>
            );
          })}
        </ul>
      </Section>
      {/* Nothing with no draft, schedule or Fantrax answer; the football above needs none of them.
          The league's full name, not `LEAGUE_COMPETITION.name` (Craig, 21 Sep 2026). */}
      {groupTies(ties).map((group) => (
        <Section
          key={`${group.competition.id}-${group.round ?? ""}`}
          title={
            group.competition.id === LEAGUE_COMPETITION.id
              ? LEAGUE_NAME
              : group.round === null
                ? group.competition.name
                : `${group.competition.name} · ${group.round}`
          }
          aside={asOf === null ? undefined : `as of ${asOf}`}
        >
          <ul className="cm-rows">
            {group.ties.map((tie, at) => (
              <li key={`${tie.home.label}-${tie.away.label}-${at}`}>
                <DraftRow
                  tie={tie}
                  scores={scores}
                  places={places}
                  mine={mine}
                  gameweek={gameweek}
                />
              </li>
            ))}
          </ul>
        </Section>
      ))}

    </>
  );
}

/** A side's total; null, which prints the dash, for one Fantrax has not given us (DESIGN §7). */
function pointsOf(teamId: string | undefined, scores: Map<string, LiveTeamScore>) {
  return teamId === undefined ? null : (scores.get(teamId)?.points ?? null);
}
