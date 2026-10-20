import { rounded } from "../format";
import { autoSubs, blank, type PositionLimits, type SubMan } from "./autoSubs";
import type { LiveRemaining, LiveTeamScore } from "./points";

// A team's live score as it stands once Fantrax's end-of-period auto subs are made: its total plus each reserve certain
// to come on. The one place the app and the paper's rule meet a live board. Pure.

/** One substitution by fantraxId: `on` takes `off`'s slot in the eleven. */
export interface AutoSubPair {
  off: string;
  on: string;
  /** The reserve has not played yet: he comes on only if he does, and adds nothing until then. */
  provisional: boolean;
}

/** What the rule reads beside the board: each man's points and minutes, his slot, the bench order and the limits. */
export interface SubsReading {
  /** Every man Fantrax priced, eleven and bench. */
  points: ReadonlyMap<string, number>;
  /** Fantrax's minutes count; absent where it stated none. */
  minutes: Readonly<Record<string, number>>;
  slots: Readonly<Record<string, string>>;
  /** Reserves by fantraxId, first to come on first. */
  order: readonly string[];
  limits: PositionLimits;
}

type Reading = Pick<SubsReading, "points" | "minutes">;

/** A man as the rule reads him; a priced man with no minutes stated has played, so he is never a blank. */
function subMan(id: string, left: number, slot: string, { points, minutes }: Reading): SubMan {
  return { fantraxId: id, slot, left, minutes: minutes[id] ?? (points.get(id) ? 1 : 0) };
}

/** Whether a starter has finished his football without a minute, so his bench is worth reading. */
export function awaitsSub(men: LiveRemaining, reading: Reading): boolean {
  return Object.entries(men.eleven).some(([id, left]) => blank(subMan(id, left, "", reading)));
}

/** The score with the substitutions counted, and the substitutions; a man whose slot is unknown stops the rule. */
export function withAutoSubs(score: LiveTeamScore, men: LiveRemaining, reading: SubsReading): { score: LiveTeamScore; subs: AutoSubPair[] } {
  const ids = Object.keys(men.eleven);
  if (ids.some((id) => reading.slots[id] === undefined)) return { score, subs: [] };
  const eleven = ids.map((id) => subMan(id, men.eleven[id] ?? 0, reading.slots[id] ?? "", reading));
  const bench = reading.order.flatMap((id) => {
    const slot = reading.slots[id];
    return slot === undefined || men.bench[id] === undefined ? [] : [subMan(id, men.bench[id] ?? 0, slot, reading)];
  });
  const subs = autoSubs(eleven, bench, reading.limits).map((s) => ({ off: s.out.fantraxId, on: s.in.fantraxId, provisional: s.provisional }));
  const added = subs.reduce((sum, s) => sum + (s.provisional ? 0 : (reading.points.get(s.on) ?? 0)), 0);
  const waiting = subs.filter((s) => s.provisional).length;
  return {
    score: {
      ...score,
      points: score.points === null ? null : rounded(score.points + added, 2),
      // A reserve still to play who will count is a man to play.
      toPlay: score.toPlay === null ? null : score.toPlay + waiting,
    },
    subs,
  };
}
