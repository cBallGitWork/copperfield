import { gameweekStarted, roundState } from "../football/round";
import type { Opposition } from "../football/opposition";
import type { Club, FootballSnapshot } from "../football/types";
import { isResolved, type RosteredTeam } from "./roster";
import { lineupDetail, type LineupDetail, type MinutesRun, type SquadPlayerDetail } from "./squadDetail";

// One team's sheet for one gameweek, as every screen that draws it agrees: who, in what order, with what points.

/** Where a gameweek stands for a sheet: no ball kicked, under way (gaps between kickoffs too), or past its last whistle. */
export type SheetStage = "unscored" | "live" | "finished";

export function sheetStage(snapshot: FootballSnapshot, at: string): SheetStage {
  if (!gameweekStarted(snapshot.fixtures, snapshot.gameweek)) return "unscored";
  const state = roundState(snapshot, at);
  return state === null || state === "live" ? "live" : "finished";
}

/** A team's eleven and bench at its stage: the gameweek's points once a ball is kicked and none before, which is no
 *  figure column; a finished week wears none of today's fitness. */
export function teamSheetDetail(
  team: RosteredTeam,
  stage: SheetStage,
  clubs: Map<number, Club>,
  opposition: Map<number, Opposition[]>,
  /** The gameweek's own, null where it would not answer. */
  points: Map<string, number | null> | null,
  minutes: MinutesRun,
  /** Fantrax's bench order for the period, first-on first. */
  bench: readonly string[],
): LineupDetail {
  const sheet = lineupDetail(team, clubs, opposition, stage === "unscored" ? null : points, minutes, bench);
  return stage === "finished" ? withoutFitness(sheet) : sheet;
}

/** A played week's sheet with today's fitness taken off: a doubt dated after the week is not the week's (review N9).
 *  `availabilityOf` reads no letter, note or chance as fit. */
export function withoutFitness(sheet: LineupDetail): LineupDetail {
  const fit = (man: SquadPlayerDetail): SquadPlayerDetail =>
    isResolved(man.rostered)
      ? {
          ...man,
          rostered: {
            ...man.rostered,
            player: { ...man.rostered.player, status: "", news: "", newsAdded: null, chanceOfPlaying: null },
          },
        }
      : man;
  return {
    ...sheet,
    rows: sheet.rows.map((line) => ({ ...line, players: line.players.map(fit) })),
    bench: sheet.bench.map(fit),
  };
}
