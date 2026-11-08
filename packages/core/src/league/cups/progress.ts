import type { Cup } from "./declared";
import { cupPlan, type CupDecided, type CupFixture, type CupStage } from "./plan";
import type { LeagueTeam } from "../types";

// A cup's draw as it stands: each tie's score off its two teams' gameweek totals, and every tie decided on points
// carried into the round that waits on it. A level tie waits for the tie-break (`decideTie`), whose counts are not read,
// unless `broken` names who went through on it, as the commissioner settled it.

/** A side's score: each team's total for the gameweek, null where there is none yet. */
export type CupScoreOf = (gameweek: number, teamId: string) => number | null;

export interface CupScore {
  home: number | null;
  away: number | null;
  /** Set once the gameweek is over and the points part the two, or a recorded tie-break settles a level tie. */
  through?: "home" | "away";
  /** Through on the tie-break, level on points. */
  tieBreak?: true;
}

export type ScoredFixture = CupFixture & { score?: CupScore };
export type ScoredStage = Omit<CupStage, "fixtures"> & { fixtures: ScoredFixture[] };

/** The draw with scores and winners. `started` and `finished` are the gameweek's, read off the schedule. */
export function cupDraw(
  cup: Cup,
  teams: number,
  seeds: readonly LeagueTeam[],
  scoreOf: CupScoreOf,
  gameweek: { started(gameweek: number): boolean; finished(gameweek: number): boolean },
  /** A level tie's winner by its code, settled by its tie-break: never read for a tie the points decide. */
  broken: ReadonlyMap<string, string> = new Map(),
): ScoredStage[] {
  const scored = (fixture: CupFixture, at: number) => scoreFor(fixture, at, scoreOf, gameweek, broken);
  const decided = new Map<string, { winner: LeagueTeam; loser: LeagueTeam }>();
  let stages = cupPlan(cup, teams, seeds, decided);
  // Each pass can settle one more round, as its sides are named by the last; a bracket has fewer rounds than ties.
  for (let pass = 0; pass <= stages.length; pass++) {
    const before = decided.size;
    for (const stage of stages) {
      for (const fixture of stage.fixtures) {
        const settled = settle(fixture, scored(fixture, stage.gameweek));
        if (settled !== null && fixture.code !== null) decided.set(fixture.code, settled);
      }
    }
    if (decided.size === before) break;
    stages = cupPlan(cup, teams, seeds, decided satisfies CupDecided);
  }
  return stages.map((stage) => ({
    ...stage,
    fixtures: stage.fixtures.map((fixture) => {
      const score = scored(fixture, stage.gameweek);
      return score === null ? fixture : { ...fixture, score };
    }),
  }));
}

/** Both sides' totals once a ball is kicked in the gameweek; null before, or while a side is still a placeholder. */
function scoreFor(
  fixture: CupFixture,
  at: number,
  scoreOf: CupScoreOf,
  gameweek: { started(gameweek: number): boolean; finished(gameweek: number): boolean },
  broken: ReadonlyMap<string, string>,
): CupScore | null {
  const { homeTeam, awayTeam } = fixture;
  if (homeTeam === undefined || awayTeam === undefined || !gameweek.started(at)) return null;
  const home = scoreOf(at, homeTeam.teamId);
  const away = scoreOf(at, awayTeam.teamId);
  if (!gameweek.finished(at) || home === null || away === null) return { home, away };
  if (home !== away) return { home, away, through: home > away ? "home" : "away" };
  // Level on points: through only on the tie-break the commissioner recorded, and only to one of these two.
  const winner = fixture.code === null ? undefined : broken.get(fixture.code);
  if (winner === homeTeam.teamId) return { home, away, through: "home", tieBreak: true };
  if (winner === awayTeam.teamId) return { home, away, through: "away", tieBreak: true };
  return { home, away };
}

function settle(fixture: CupFixture, score: CupScore | null): { winner: LeagueTeam; loser: LeagueTeam } | null {
  if (score?.through === undefined || fixture.homeTeam === undefined || fixture.awayTeam === undefined) return null;
  return score.through === "home"
    ? { winner: fixture.homeTeam, loser: fixture.awayTeam }
    : { winner: fixture.awayTeam, loser: fixture.homeTeam };
}
