import type { RosterSlot } from "../types";
import {
  benchToWrite,
  changesLineup,
  fieldMapFor,
  lineupChanges,
  mapLineupState,
  readBenchAnswer,
  readLineupAnswer,
  stillHeld,
  type FieldMap,
  type WriteAnswer,
} from "./lineupWrite";

// A manager's planned lineup written to Fantrax, in the one order that is safe: read what Fantrax holds, refuse a
// page that is behind it, ask Fantrax whether the lineup is legal, write it, then the bench. The caller gates who and
// when; this owns the steps, behind a port so a test can replay Fantrax's answers.

/** What the page planned, and what it loaded as Fantrax's. */
export interface PlannedLineup {
  slots: RosterSlot[];
  /** Reserves' ids in the order they come on. */
  bench: string[];
  /** Whether the manager reordered the bench; an unnumbered one is otherwise left to Fantrax. */
  reordered: boolean;
  held: { slots: RosterSlot[]; bench: string[] };
}

/** Fantrax's three calls for one team and period, raw answers in; `fantraxLineupPort` is the real one. */
export interface LineupPort {
  state(): Promise<unknown>;
  sendLineup(write: { fieldMap: FieldMap; applyToFuturePeriods: boolean; dryRun: boolean }): Promise<unknown>;
  sendBench(order: Record<string, number>): Promise<unknown>;
}

export type SaveStep = "dry-run" | "lineup" | "bench";

/** What the save sets out to change, for the audit line: whether the lineup moves, who moved where, and the bench
 *  order sent (null: Fantrax's left alone). */
export interface SaveRecord {
  lineup: boolean;
  moved: ReturnType<typeof lineupChanges>;
  bench: Record<string, number> | null;
}

/** Told of each write as Fantrax answers it, before the next is sent; a passed dry run is not a write. */
export type OnStep = (step: SaveStep, answer: WriteAnswer, record: SaveRecord) => void;

export type LineupSave =
  /** Fantrax's roster could not be read, or is filed for another period. */
  | { outcome: "unreadable" }
  /** Fantrax no longer holds what the page loaded: the page is stale. */
  | { outcome: "moved-on" }
  /** The plan cannot be placed on Fantrax's rows. */
  | { outcome: "unplaceable" }
  /** Fantrax answered; `stale` when what the page shows may no longer be Fantrax's. */
  | { outcome: "answered"; answer: WriteAnswer; stale: boolean };

/** Writes `plan` for `period` through `port`, stopping at the first refusal. Throws only when the port does. */
export async function writeLineup(port: LineupPort, period: number, plan: PlannedLineup, onStep: OnStep): Promise<LineupSave> {
  const state = mapLineupState(await port.state());
  if (state === null || state.period !== period) return { outcome: "unreadable" };
  if (!stillHeld(state, plan.held)) return { outcome: "moved-on" };
  const fieldMap = fieldMapFor(state, plan.slots);
  if (typeof fieldMap === "string") return { outcome: "unplaceable" };

  const record: SaveRecord = {
    lineup: changesLineup(state, fieldMap),
    moved: lineupChanges(state, fieldMap),
    bench: benchToWrite(plan.bench, plan.reordered, state.autoSubOrder),
  };
  const answered = (answer: WriteAnswer, stale: boolean): LineupSave => ({ outcome: "answered", answer, stale });

  if (record.lineup) {
    const send = (dryRun: boolean) => port.sendLineup({ fieldMap, applyToFuturePeriods: state.applyToFuturePeriods, dryRun });
    const dry = readLineupAnswer(await send(true));
    if (!dry.ok) {
      onStep("dry-run", dry, record);
      return answered(dry, false);
    }
    const done = readLineupAnswer(await send(false));
    onStep("lineup", done, record);
    if (!done.ok) return answered(done, false);
  }
  if (record.bench !== null) {
    const done = readBenchAnswer(await port.sendBench(record.bench));
    onStep("bench", done, record);
    // The lineup above may have gone through, and the page must show it.
    if (!done.ok) return answered(done, record.lineup);
  }
  return answered({ ok: true }, true);
}
