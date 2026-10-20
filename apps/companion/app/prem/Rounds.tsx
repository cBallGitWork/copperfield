import { type Club, type Fixture, type FootballPlayer, type FootballSnapshot, type PlayerOwner } from "@epl/core";
import Match from "./Match";
import MatchList from "../components/football/MatchList";
import RoundHead, { type RoundStep } from "../components/shell/RoundHead";

// One round of the season under its head; Fixtures picks it and steps between them.

export interface Round {
  gameweek: number;
  fixtures: Fixture[];
}

/** What a signed-in reader's rows open onto: his men per match, who holds whom, and the round's lines once it starts. */
export interface RoundMen {
  mine: Map<number, FootballPlayer[]>;
  owners?: Map<number, PlayerOwner>;
  lines: FootballSnapshot | null;
  /** Whether `lines` may call a match in play live. */
  now: boolean;
}

export default function RoundMatches({
  round,
  clubs,
  places,
  step,
  men,
}: {
  round: Round;
  clubs: Map<number, Club>;
  /** Each club's place in the table, for the row's blue block. Built by the
   *  page, because it is the page that holds the season's fixtures. */
  places: Map<number, number>;
  /** The arrows either side of the head. */
  step: RoundStep;
  /** Undefined with no reader, so no row holds a count. */
  men?: RoundMen;
}) {
  return (
    <section className="flex flex-col">
      <RoundHead gameweek={round.gameweek} step={step} />
      <div className="cm-rows flex flex-col">
        {round.fixtures.map((fixture) => {
          const yours = men?.mine.get(fixture.id) ?? [];
          return (
            <Match
              key={fixture.id}
              fixture={fixture}
              clubs={clubs}
              places={places}
              yours={men === undefined ? undefined : yours.length}
              men={
                men === undefined || yours.length === 0 ? undefined : (
                  <MatchList fixture={fixture} clubs={clubs} lines={men.lines} now={men.now} yours={yours} owners={men.owners} />
                )
              }
            />
          );
        })}
      </div>
    </section>
  );
}

/** Groups fixtures into ascending rounds; one with no gameweek yet is left out, not filed under nought. */
export function byRound(fixtures: readonly Fixture[]): Round[] {
  const rounds = new Map<number, Fixture[]>();
  for (const fixture of fixtures) {
    if (fixture.gameweek === null) continue;
    const round = rounds.get(fixture.gameweek) ?? [];
    round.push(fixture);
    rounds.set(fixture.gameweek, round);
  }

  return [...rounds.entries()]
    .sort(([a], [b]) => a - b)
    .map(([gameweek, list]) => ({
      gameweek,
      // Kick-off order; an undated fixture sorts last, not first as an empty string would.
      fixtures: list.sort((a, b) => (a.kickoff ?? "￿").localeCompare(b.kickoff ?? "￿")),
    }));
}
