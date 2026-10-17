import { DRAFT_NEWS } from "../../config";
import type { MatchupContext } from "./brief";
import { thread, type Thread } from "./thread";
import { matchThreads } from "./threadsMatch";
import { manThreads } from "./threadsMen";
import { counted } from "./state";
import { beatOf } from "./timeline";
import { returnPoints } from "./worth";
import { possessive } from "./words";
import type { DraftMan, SlotWorth } from "./types";

// Every thread a match-up's story could be told through, weighed (DRAFT_NEWS): the match's shape, a man's gameweek and
// the season's; then the ones that decided it. The desk decides what the story is;
// the writer tells it. Pure.

const bump = (t: Thread, by: number): Thread => ({ ...t, weight: t.weight + by, decisive: true });

/** The decider (+30, one): the substitutions if they turned it, a late goal worth more than the margin, or the one man
 *  whose returns alone are worth more than it. Two such men, or none, and nobody decided it alone. */
function decisiveAtEnd(ctx: MatchupContext, threads: Thread[], worth: SlotWorth): Thread[] {
  const { home, away, margin } = ctx.state;
  if (margin === 0) return threads;
  const winner = margin > 0 ? home : away;
  const loser = margin > 0 ? away : home;
  const out = [...threads];
  let at = out.findIndex((t) => t.kind === "bench-turned");
  if (at < 0) at = out.findIndex((t) => t.kind === "late-decider");
  if (at < 0) {
    const [key, ...others] = counted(winner).filter((m) => returnPoints(m, worth) > Math.abs(margin));
    if (key !== undefined && others.length === 0) {
      at = out.findIndex((t) => t.teamId === winner.side.teamId && t.men[0] === key);
      if (at < 0) {
        out.push(thread("match-winner", { teamId: winner.side.teamId, men: [key], beat: beatOf(ctx.state, key), facts: [`without ${possessive(key.name)} returns ${loser.side.name} would have won`] }));
        at = out.length - 1;
      }
    }
  }
  if (at >= 0) out[at] = bump(out[at], DRAFT_NEWS.decider);
  return out;
}

/** The season's facts as threads, each tagged with its own kind for its frame. */
function seasonThreads(ctx: MatchupContext): Thread[] {
  return ctx.form.map((f) => thread(f.kind, { teamId: f.teamId, facts: [f.text] }));
}

export function threadsOf(ctx: MatchupContext, worth: SlotWorth, gameweek: number): Thread[] {
  const place = (man: DraftMan) => beatOf(ctx.state, man);
  const own = [...manThreads(ctx, worth, gameweek, place), ...seasonThreads(ctx)];
  const all = [...matchThreads(ctx, worth), ...own];
  // The goal that decided it is told once, as the decider, and a reserve whose points cost the match once, as that.
  const decider = all.find((t) => t.kind === "late-decider")?.men[0];
  const cost = all.find((t) => t.kind === "bench-cost")?.men[0];
  return decisiveAtEnd(ctx, all.filter((t) => !(t.kind === "late-goal" && t.men[0] === decider) && !(t.kind === "bench-six" && t.men[0] === cost)), worth);
}
