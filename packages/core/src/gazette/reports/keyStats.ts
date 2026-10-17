import { KEY_STATS, REPORTS, THE_HOUR } from "../../config";
import { clock } from "./minutes";
import { offEarly, played } from "./men";
import { assistsBy, goalsBy, type ManCounts, type MatchEvent } from "./timeline";
import type { ReportMan, ReportMatchInput } from "./types";
import { type Side } from "../side";
import { fixed, howMany } from "../../format";
import { surname } from "../../names";

// The key-stats box: desk-made lines with figures, never written by the model, in the order a manager reads them: the
// league's points first, then the match. xG and xA print here and the prose stays in words. A red card is the line-ups'
// and the timeline's, so it is not printed a third time.

export interface KeyStat {
  label: string;
  value: string;
}

const { mostShots: MOST_SHOTS, chances: CHANCES, expectedAssists: EXPECTED_ASSISTS, pointsMen: POINTS_MEN } = REPORTS.stats;

/** The men who lead one count, and the count, or null when nobody reaches `least`. */
function leaders(men: readonly ReportMan[], value: (m: ReportMan) => number, least: number): { men: ReportMan[]; value: number } | null {
  const best = Math.max(0, ...men.map(value));
  return best < least ? null : { men: men.filter((m) => value(m) === best), value: best };
}

/** "Cherki 0.58, Haaland 0.40": the first few men past `least`, most first, each named by `nameOf`; empty when nobody reaches it. */
function topLine<M>(men: readonly M[], value: (man: M) => number, least: number, nameOf: (man: M) => string): string {
  return [...men].filter((man) => value(man) >= least).sort((a, b) => value(b) - value(a)).slice(0, KEY_STATS.topMen)
    .map((man) => `${nameOf(man)} ${fixed(value(man), "expected")}`).join(", ");
}

/** "Top xG" and "Top xA": the men who got into the best positions and made the best chances, whether or not they
 *  scored, the first few past `KEY_STATS`' bar. A line nobody reaches is left out. */
export function topLines(men: readonly { name: string; expectedGoals: number; expectedAssists: number }[]): KeyStat[] {
  return [
    { label: "Top xG", value: topLine(men, (man) => man.expectedGoals, KEY_STATS.expectedGoals, (man) => surname(man.name)) },
    { label: "Top xA", value: topLine(men, (man) => man.expectedAssists, KEY_STATS.expectedAssists, (man) => surname(man.name)) },
  ].filter((line) => line.value !== "");
}

/** `keeperRung` is the fewest saves the league pays a keeper for; null leaves the saves out. */
export function keyStats(match: ReportMatchInput, events: readonly MatchEvent[], counts: ReadonlyMap<number, ManCounts>, budget: number, keeperRung: number | null): KeyStat[] {
  const men = match.men.filter(played);
  const c = (m: ReportMan) => counts.get(m.code);
  const scored = (m: ReportMan) => goalsBy(events, m.code);
  const assists = (m: ReportMan) => assistsBy(events, m.code);
  const short = (side: Side) => match[side].shorts[0] ?? match[side].name;
  const names = (list: readonly ReportMan[]) => list.map((m) => m.surname).join(", ");
  const nameOf = (m: ReportMan) => m.surname;
  const conceded = (m: ReportMan) => (m.side === "home" ? match.fixture.awayScore : match.fixture.homeScore) ?? 0;
  const out: KeyStat[] = [];
  const line = (label: string, value: string) => {
    if (value !== "") out.push({ label, value });
  };

  const priced = men.filter((m) => m.points !== null).sort((a, b) => (b.points ?? 0) - (a.points ?? 0)).slice(0, POINTS_MEN);
  line("Points", priced.map((m) => `${m.surname} ${m.points}${m.holder === null ? "" : ` (${m.holder.team})`}`).join(", "));
  if (match.figures !== null) {
    const { home, away } = match.figures;
    line("Shots", `${home.shots} (${home.onTarget} on target) v ${away.shots} (${away.onTarget})`);
  }
  const xg = (side: Side) => men.filter((m) => m.side === side).reduce((sum, m) => sum + m.expectedGoals, 0);
  if (men.some((m) => m.expectedGoals > 0)) line("xG", `${short("home")} ${fixed(xg("home"), "expected")}, ${short("away")} ${fixed(xg("away"), "expected")}`);
  const keepers = men.filter((m) => m.line === "G" && ((keeperRung !== null && m.saves >= keeperRung) || events.some((e) => e.kind === "penalty-saved" && e.side !== m.side)));
  line("Saves", keepers.map((m) => `${m.surname} ${m.saves}`).join(", "));
  const defending = men.filter((m) => (m.defensive ?? 0) > 0).sort((a, b) => (b.defensive ?? 0) - (a.defensive ?? 0)).slice(0, KEY_STATS.topMen);
  line("DefCon", defending.map((m) => `${m.surname} ${m.defensive}`).join(", "));
  line("Clean sheet, full match", names(men.filter((m) => (m.line === "G" || m.line === "D") && m.started && m.offAt === null && conceded(m) === 0)));
  const early = men.filter((m) => offEarly(m) || (m.injuredOff && m.offAt !== null && (clock(m.offAt)?.minute ?? THE_HOUR) < THE_HOUR));
  line("Off before the hour", early.map((m) => `${m.surname} ${m.offAt}${m.injuredOff ? " (injured)" : ""}`).join(", "));
  const unconverted = men.filter((m) => m.expectedGoals >= REPORTS.missed.goodEnough && scored(m) === 0);
  line("xG without a goal", topLine(unconverted, (m) => m.expectedGoals, REPORTS.missed.goodEnough, nameOf));

  const shots = leaders(men, (m) => c(m)?.shots ?? 0, MOST_SHOTS);
  if (shots !== null && shots.men.length === 1) {
    const [man] = shots.men;
    const goals = scored(man);
    line("Most shots", `${man.surname} ${shots.value} (${c(man)?.onTarget ?? 0} on target${goals > 0 ? `, ${howMany(goals, "goal")}` : ""})`);
  }
  const chances = leaders(men, (m) => c(m)?.chancesMade ?? 0, 1);
  const byXa = [...men].sort((a, b) => b.expectedAssists - a.expectedAssists)[0];
  if (chances !== null && (chances.value >= CHANCES || (byXa?.expectedAssists ?? 0) >= EXPECTED_ASSISTS)) {
    line("Chances created", chances.men.map((m) => `${m.surname} ${chances.value}${assists(m) > 0 ? ` (${howMany(assists(m), "assist")})` : ""}`).join(", "));
  }
  // A man already under xG without a goal is not printed twice.
  line("Top xG", topLine(men.filter((m) => !unconverted.includes(m)), (m) => m.expectedGoals, KEY_STATS.expectedGoals, nameOf));
  line("Top xA", topLine(men, (m) => m.expectedAssists, KEY_STATS.expectedAssists, nameOf));
  line("Hit the woodwork", names([...new Set(events.flatMap((e) => (e.kind === "woodwork" && e.man !== null ? [e.man] : [])))]));
  return out.slice(0, budget);
}
