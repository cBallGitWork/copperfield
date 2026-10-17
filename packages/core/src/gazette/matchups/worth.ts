import type { DraftMan, SlotWorth, Worth } from "./types";

/** What a slot is paid for one kind of return; 0 when the league pays it nothing there. */
export function priceOf(worth: SlotWorth, slot: string, kind: Worth["kind"]): number {
  return worth.returns[slot]?.find((w) => w.kind === kind)?.worth ?? 0;
}

/** What a man's goals, assists and clean sheets were worth at his slot, without his minutes or anything else. */
export const returnPoints = (m: DraftMan, worth: SlotWorth) =>
  m.goals * priceOf(worth, m.slot, "goal") + m.assists * priceOf(worth, m.slot, "assist") + m.cleanSheets * priceOf(worth, m.slot, "clean sheet");
