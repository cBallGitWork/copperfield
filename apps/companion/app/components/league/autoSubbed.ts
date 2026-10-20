import { type AutoSubPair, type LineupDetail, type SquadPlayerDetail, playerName } from "@epl/core";

// A sheet with the auto subs made: the reserve in the starter's slot, the starter at the end of the bench, and a mark
// on each saying who for whom. Scoring stays the roster slot's: the sheet only moves men, never reprices them.

/** One side of an auto sub: `on` came on for `with`, or went off for him. */
export interface AutoSubMark {
  on: boolean;
  /** The other man's name, as his shirt has it. */
  with: string;
  /** The reserve has not played yet. */
  provisional: boolean;
}

const idOf = (player: SquadPlayerDetail) => player.rostered.slot.fantraxId;

export function autoSubbed(sheet: LineupDetail, subs: readonly AutoSubPair[]): { sheet: LineupDetail; marks: Record<string, AutoSubMark> } {
  const everyone = new Map([...sheet.rows.flatMap((line) => line.players), ...sheet.bench].map((p) => [idOf(p), p]));
  const made = subs.flatMap((s) => {
    const off = everyone.get(s.off);
    const on = everyone.get(s.on);
    return off === undefined || on === undefined ? [] : [{ ...s, offMan: off, onMan: on }];
  });
  if (made.length === 0) return { sheet, marks: {} };
  const coming = new Set(made.map((s) => s.on));
  return {
    sheet: {
      ...sheet,
      rows: sheet.rows.map((line) => ({ ...line, players: line.players.map((p) => made.find((s) => s.off === idOf(p))?.onMan ?? p) })),
      bench: [...sheet.bench.filter((p) => !coming.has(idOf(p))), ...made.map((s) => s.offMan)],
    },
    marks: Object.fromEntries(
      made.flatMap((s) => [
        [s.on, { on: true, with: playerName(s.offMan.rostered), provisional: s.provisional }],
        [s.off, { on: false, with: playerName(s.onMan.rostered), provisional: s.provisional }],
      ]),
    ),
  };
}

/** What a man's card says of his auto sub, in one line. */
export function autoSubLine({ on, with: other, provisional }: AutoSubMark): string {
  if (on) return provisional ? `Auto-sub: comes on for ${other}, who did not play, if he plays.` : `Auto-sub: on for ${other}, who did not play.`;
  return `Auto-sub: did not play, so ${other} comes on for him${provisional ? ` if ${other} plays` : ""}.`;
}
