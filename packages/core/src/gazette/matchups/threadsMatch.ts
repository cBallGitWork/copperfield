import { DRAFT_NEWS } from "../../config";
import { listed } from "../../format";
import { ordinal } from "../../league/ordinal";
import { londonDayOf } from "../../time";
import type { MatchupContext, TablePlace } from "./brief";
import { counted, lateDecider, type SideState } from "./state";
import { pts, returnCount, returnWords, whenScored } from "./stories";
import { thread, type Thread } from "./thread";
import { SIDES, type Side } from "../side";
import { beatOf } from "./timeline";
import type { DraftMan, SlotWorth } from "./types";
import { possessive } from "./words";

// The match's shape at the end of the gameweek: turned by the bench, cost by the bench, decided late, one man's result,
// level, close, an upset, a rout. Never who led at a day's end, which is the fixture list's. Pure.

/** A man with most of his side's points: 10 or more and over a third of its total. */
function oneManShows(ctx: MatchupContext): Thread[] {
  return SIDES.flatMap((w) => {
    const s = ctx.state[w];
    return counted(s)
      .filter((m) => (m.points ?? 0) >= DRAFT_NEWS.oneManPoints && (m.points ?? 0) >= DRAFT_NEWS.oneManShare * s.total)
      .map((m) => thread("one-man-show", { teamId: s.side.teamId, men: [m], beat: beatOf(ctx.state, m), facts: [`${m.name} got ${m.points} of ${possessive(s.side.name)} ${s.total}${returnCount(m) === 0 ? "" : `: ${returnWords(m)}`}`] }));
  });
}

/** A draw. */
const level = (ctx: MatchupContext) => thread("level", { teamId: null, facts: [`${ctx.state.home.side.name} and ${ctx.state.away.side.name} drew ${ctx.state.home.total}-${ctx.state.away.total}`] });

/** Two sides' men who both returned in the same Premier League match, on opposing clubs: one match, two stories. */
function sameMatch(ctx: MatchupContext): Thread[] {
  const [home, away] = [counted(ctx.state.home), counted(ctx.state.away)];
  const labels = new Map([...home, ...away].flatMap((m) => m.matches.map((x) => [x.code, x.label] as const)));
  return [...labels].flatMap(([code, label]) => {
    const inIt = (men: readonly DraftMan[]) => men.filter((m) => returnCount(m) > 0 && m.minutes > 0 && m.matches.some((x) => x.code === code));
    const [h, a] = [inIt(home), inIt(away)];
    if (!h.some((x) => a.some((y) => x.club !== y.club))) return [];
    const told = (men: readonly DraftMan[], name: string) => `${listed(men.map((m) => `${m.name} (${returnWords(m)})`), "and")} for ${name}`;
    return [thread("same-match", { teamId: null, men: [...h, ...a], facts: [`${label}, one match: ${told(h, ctx.state.home.side.name)}; ${told(a, ctx.state.away.side.name)}`] })];
  });
}

/** The loser's reserve who outscored a starter in his position by more than the margin: a call that cost the match. */
function benchCost(L: SideState, m: number): Thread[] {
  const eleven = counted(L);
  const best = L.side.bench
    .filter((r) => !L.subs.some((s) => s.in === r) && r.points !== null)
    .flatMap((r) => {
      const starter = eleven.filter((x) => x.slot === r.slot && x.minutes > 0).sort((a, b) => (a.points ?? 0) - (b.points ?? 0))[0];
      return starter === undefined || (r.points ?? 0) - (starter.points ?? 0) <= m ? [] : [{ r, starter }];
    })
    .sort((a, b) => (b.r.points ?? 0) - (a.r.points ?? 0))[0];
  if (best === undefined) return [];
  const { r, starter } = best;
  return [thread("bench-cost", { teamId: L.side.teamId, men: [r], facts: [`${L.side.name} lost by ${m} with ${possessive(r.name)} ${pts(r.points ?? 0)} on the bench, where ${starter.name} got ${pts(starter.points ?? 0)} in the eleven`] })];
}

/** The league's own gameweek, counted from the side's settled results going in. */
const leagueWeek = (p: TablePlace) => p.won + p.drawn + p.lost + 1;

export function matchThreads(ctx: MatchupContext, worth: SlotWorth): Thread[] {
  const { margin } = ctx.state;
  if (margin === 0) return [level(ctx), ...oneManShows(ctx), ...sameMatch(ctx)];
  const [w, l]: [Side, Side] = margin > 0 ? ["home", "away"] : ["away", "home"];
  const [W, L, m] = [ctx.state[w], ctx.state[l], Math.abs(margin)];
  const out = [...oneManShows(ctx), ...sameMatch(ctx)];
  // Turned by the bench: without the winner's own certain substitutions, the other side would have won.
  if (W.brought > m) {
    const on = W.subs.filter((s) => !s.provisional);
    // The reserves' own points are the cast's, given once there.
    const who = listed(on.map((s) => `${s.in.name} in for ${s.out.name}`), "and");
    out.push(thread("bench-turned", { teamId: W.side.teamId, men: on.map((s) => s.in), beat: null, facts: [`${L.side.name} would have won without the automatic substitutions, which put ${who} for ${W.side.name}`] }));
  }
  const late = lateDecider(W, m, worth);
  if (late !== null) {
    out.push(thread("late-decider", { teamId: W.side.teamId, men: [late.m], beat: londonDayOf(late.t.kickoff) ?? undefined, bigger: late.t.added !== undefined, facts: [`${late.m.name} scored ${whenScored(late.t)}; without that goal ${L.side.name} would have won`] }));
  }
  out.push(...benchCost(L, m));
  if (m <= DRAFT_NEWS.closeWithin) out.push(thread("close", { teamId: W.side.teamId, bigger: m === 1, facts: [`${W.side.name} won by ${m}`] }));
  const [pw, pl] = [ctx.places[w], ctx.places[l]];
  if (pw !== null && pl !== null && leagueWeek(pw) >= DRAFT_NEWS.upsetFrom && pw.rank - pl.rank >= DRAFT_NEWS.upsetPlaces) {
    out.push(thread("upset", { teamId: W.side.teamId, bigger: pl.rank === 1, facts: [`${W.side.name} were ${ordinal(pw.rank)} going into the gameweek and ${L.side.name} ${ordinal(pl.rank)}`] }));
  }
  if (m >= DRAFT_NEWS.routFrom) out.push(thread("rout", { teamId: W.side.teamId, bigger: m >= DRAFT_NEWS.bigRoutFrom, facts: [`${W.side.name} won by ${m}`] }));
  return out;
}
