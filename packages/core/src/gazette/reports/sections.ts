import { REPORTS } from "../../config";
import { firstLeagueStart, played } from "./men";
import { involvedIn, isGoal, type MatchEvent } from "./timeline";
import type { ReportMan } from "./types";

// Who gets a section, chosen in code: men whose day is news by their league points or a goal, whatever earned them, in
// themed sections of up to three, and never more sections than the match's budget.

/** One section's men, one to three, and the weight it is ordered by. */
export interface SectionPick {
  men: ReportMan[];
  weight: number;
}

const { weight: W, newsPoints, closeTie } = REPORTS;
/** The most men one section is about. */
const SECTION_MEN = 3;

/** Whether two men are on opposite sides of a head-to-head this gameweek. */
export const opposed = (a: ReportMan, b: ReportMan) =>
  a.holder !== null && b.holder !== null && a.holder.team !== b.holder.team && a.holder.h2h.some((h) => h.opponent === b.holder?.team);

/** His day's worth to the league page: his points, his goals and assists, and what makes it league news. */
export function weightOf(m: ReportMan, involved: number): number {
  const points = m.points ?? 0;
  const h = m.holder;
  const news = involved > 0 || points >= newsPoints;
  const close = h?.h2h.some((t) => t.us !== null && t.them !== null && Math.abs(t.us - t.them) <= closeTie) ?? false;
  return (
    Math.abs(points) +
    W.involvement * involved +
    (h !== null && !h.fielded && news ? W.bench : 0) +
    (h === null && (news || m.expectedGoals >= REPORTS.missed.goodEnough) ? W.freeAgent : 0) +
    (m.dropped !== null || (h?.since ?? null) !== null ? W.moved : 0) +
    (close ? W.closeTie : 0) +
    (h !== null && (m.sentOff || m.injuredOff) ? W.lost : 0)
  );
}

/** The match's sections, weightiest first, `budget` at most. Themes in this order fill it: owned men on the two sides of one
 *  head-to-head; owned points left on a bench; claims this gameweek; a free agent with the points and a second reason
 *  (a goal or an assist, a first league start, dropped this week) alone; any other owned man; the other free agents in
 *  one section. Free agents who do not fit alone share the last place. */
export function pickSections(men: readonly ReportMan[], events: readonly MatchEvent[], budget: number, star: ReportMan | null): SectionPick[] {
  const goals = events.filter(isGoal);
  const involved = (m: ReportMan) => involvedIn(goals, m.code);
  // A stake carries his points, so a man the league never priced gets no section; nor does a day that is no news, unless a
  // manager lost a man of his eleven to an injury or a red card.
  const news = (m: ReportMan) => involved(m) > 0 || Math.abs(m.points ?? 0) >= newsPoints || (m.holder?.fielded === true && (m.sentOff || m.injuredOff));
  const weights = new Map(men.map((m) => [m.code, weightOf(m, involved(m))]));
  const weight = (m: ReportMan) => weights.get(m.code) ?? 0;
  const ranked = men
    .filter((m) => played(m) && m.points !== null && news(m))
    .sort((a, b) => weight(b) - weight(a) || Number(b.code === star?.code) - Number(a.code === star?.code) || (b.points ?? 0) - (a.points ?? 0));
  const one = (m: ReportMan): SectionPick => ({ men: [m], weight: weight(m) });
  const group = (all: readonly ReportMan[]): SectionPick[] => (all.length === 0 ? [] : [{ men: all.slice(0, SECTION_MEN), weight: weight(all[0]) }]);

  const used = new Set<number>();
  const take = (m: ReportMan) => (used.has(m.code) ? false : (used.add(m.code), true));
  const ties: SectionPick[] = [];
  for (const m of ranked.filter((r) => r.holder !== null)) {
    const partner = used.has(m.code) ? undefined : ranked.find((r) => r !== m && !used.has(r.code) && opposed(m, r));
    if (partner === undefined) continue;
    take(m);
    take(partner);
    ties.push({ men: [m, partner], weight: Math.max(weight(m), (weight(m) + weight(partner)) / 2 + W.joint) });
  }
  const owned = ranked.filter((m) => m.holder !== null && !used.has(m.code));
  const bench = owned.filter((m) => m.holder?.fielded === false).slice(0, SECTION_MEN).filter(take);
  const claims = owned.filter((m) => (m.holder?.since ?? null) !== null).slice(0, SECTION_MEN).filter(take);
  const free = ranked.filter((m) => m.holder === null);
  const must = free.filter((m) => Math.abs(m.points ?? 0) >= newsPoints && (involved(m) > 0 || firstLeagueStart(m) || m.dropped !== null));
  const others = free.filter((m) => !must.includes(m));

  const picks = [...ties, ...group(bench), ...group(claims)].slice(0, budget);
  const room = budget - picks.length;
  if (room > 0 && must.length > room) {
    // More free agents to tell than places: the weightiest stand alone, the rest share the last place.
    picks.push(...must.slice(0, room - 1).map(one), ...group([...must.slice(room - 1), ...others]));
  } else {
    picks.push(...must.map(one));
    picks.push(...owned.filter((m) => !used.has(m.code)).map(one).slice(0, budget - picks.length));
    if (picks.length < budget) picks.push(...group(others));
  }
  return picks.slice(0, budget).sort((a, b) => b.weight - a.weight);
}
