import type { Fixture, MatchEventKind } from "@epl/core";
import type { WireLine } from "./wireLines";

// Each match's goals off the ownership join, by side, for the Scores row: the 15:50 test's "who scored" with no tap.

/** One goal as the Scores row prints it. */
export interface GoalNote {
  key: string;
  scorer: string;
  minute: string;
  kind: MatchEventKind;
  /** Null for an unassisted goal. */
  assister: string | null;
  scorerMine: boolean;
  assisterMine: boolean;
}

export interface FixtureGoals {
  home: GoalNote[];
  away: GoalNote[];
}

const GOAL_KINDS: ReadonlySet<MatchEventKind> = new Set(["goal", "penalty-goal", "own-goal"]);

/** Goals by fixture id, each side oldest first; a goal whose scorer the join could not place is left out. */
export function fixtureGoals(lines: readonly WireLine[], fixtures: readonly Fixture[]): Map<number, FixtureGoals> {
  const byCode = new Map(fixtures.map((fixture) => [fixture.code, fixture]));
  const goals = new Map<number, FixtureGoals>();
  const oldestFirst = [...lines].sort((a, b) => (a.at ?? 0) - (b.at ?? 0));

  for (const line of oldestFirst) {
    const fixture = byCode.get(line.fixtureCode);
    if (!GOAL_KINDS.has(line.kind) || line.man === null || fixture === undefined) continue;
    const ownClub = line.man.player.clubId === fixture.homeClubId;
    // An own goal counts for the other side.
    const home = line.kind === "own-goal" ? !ownClub : ownClub;
    const entry = goals.get(fixture.id) ?? { home: [], away: [] };
    (home ? entry.home : entry.away).push({
      key: line.key,
      scorer: line.man.player.name,
      minute: line.minute,
      kind: line.kind,
      assister: line.second?.player.name ?? null,
      scorerMine: line.man.mine,
      assisterMine: line.second?.mine ?? false,
    });
    goals.set(fixture.id, entry);
  }
  return goals;
}
