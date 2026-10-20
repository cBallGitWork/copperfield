// Fantrax's end-of-period auto subs, in advance: a starter with every match done and no minutes gives way to the first
// reserve by bench number who has played or may yet and keeps every position within its limits.

/** Position letter to the fewest and most the eleven may field there. */
export interface PositionLimits {
  min: Record<string, number>;
  max: Record<string, number>;
}

/** What the rule reads of a man: his roster slot, his minutes, and how much of his football is still to come. */
export interface SubMan {
  fantraxId: string;
  /** The slot Fantrax scores him at, in the league's letters. */
  slot: string;
  minutes: number;
  /** Football still to come, as matches or a share of them: nought once every match is done. */
  left: number;
}

export interface AutoSub<M extends SubMan = SubMan> {
  out: M;
  in: M;
  /** True when the reserve has not played yet: he comes in only if he does. */
  provisional: boolean;
  /** A man ahead of `out`, still to play, whom this reserve replaces instead if he blanks; null when none. */
  ahead: M | null;
}

/** A man who will finish the period with no minutes: every match done, none of it played. */
export const blank = (man: SubMan) => man.minutes === 0 && man.left === 0;
/** A man who has played, or still may. */
const available = (man: SubMan) => man.minutes > 0 || man.left > 0;

function fits(eleven: readonly SubMan[], out: SubMan, candidate: SubMan, limits: PositionLimits): boolean {
  const count = (slot: string) => eleven.filter((m) => m !== out && m.slot === slot).length + (candidate.slot === slot ? 1 : 0);
  const slots = new Set([...eleven.map((m) => m.slot), candidate.slot, ...Object.keys(limits.min), ...Object.keys(limits.max)]);
  return [...slots].every((slot) => count(slot) >= (limits.min[slot] ?? 0) && count(slot) <= (limits.max[slot] ?? Infinity));
}

/** The substitutions Fantrax will make, in the eleven's order, from `bench` as numbered; each reserve comes on once. */
export function autoSubs<M extends SubMan>(eleven: readonly M[], bench: readonly M[], limits: PositionLimits): AutoSub<M>[] {
  const lineup: M[] = [...eleven];
  const used = new Set<string>();
  const subs: AutoSub<M>[] = [];
  for (const out of eleven.filter(blank)) {
    const candidate = bench.find((b) => !used.has(b.fantraxId) && available(b) && fits(lineup, out, b, limits));
    if (candidate === undefined) continue;
    const ahead = eleven.slice(0, eleven.indexOf(out)).find((m) => m.left > 0 && m.minutes === 0 && fits(lineup, m, candidate, limits)) ?? null;
    used.add(candidate.fantraxId);
    lineup[lineup.indexOf(out)] = candidate;
    subs.push({ out, in: candidate, provisional: candidate.minutes === 0, ahead });
  }
  return subs;
}
