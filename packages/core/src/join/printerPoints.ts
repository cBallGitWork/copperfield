import { ASSIST, type FantraxCategory, GOALS, OWN_GOALS, RED_CARDS, YELLOW_CARDS, firstScored } from "../league/categoryNames";
import { type LeagueScoring, categoryPoints } from "../league/scoring";
import type { PrinterKind } from "./vidiprinter";

// What one vidiprinter action earned a drafted man, at the slot his manager played him in, by the league's own price.

/** The first man on a line did the kind; the second assisted it. */
type PrinterRole = "first" | "second";

/** The categories each priced action arrives under, by role; a league prices only its own. */
const PRICED: Partial<Record<PrinterKind, Partial<Record<PrinterRole, readonly FantraxCategory[]>>>> = {
  goal: { first: [GOALS], second: ASSIST },
  "penalty-goal": { first: [GOALS], second: ASSIST },
  "own-goal": { first: [OWN_GOALS] },
  booked: { first: [YELLOW_CARDS] },
  "sent-off": { first: [RED_CARDS] },
};

/** Null for a man in no eleven (`slot` undefined), an action the league does not price, or a tiered price. */
export function actionPoints(kind: PrinterKind, role: PrinterRole, slot: string | undefined, scoring: LeagueScoring | null): number | null {
  const options = PRICED[kind]?.[role];
  if (slot === undefined || scoring === null || options === undefined) return null;
  const category = firstScored(scoring.categories, options);
  return category === null ? null : categoryPoints(scoring.rules, category.short, slot);
}
