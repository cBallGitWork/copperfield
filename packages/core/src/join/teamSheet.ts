import { isResolved } from "./roster";
import type { LineupDetail, SquadPlayerDetail } from "./squadDetail";

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
