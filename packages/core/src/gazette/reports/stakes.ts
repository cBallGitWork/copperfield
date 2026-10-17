import { capital, listed, plural } from "../../format";
import { firstLeagueStart } from "./men";
import { numeral } from "./minutes";
import type { SectionPick } from "./sections";
import type { HeadToHeadStake, ReportMan } from "./types";

// Each section's stake, written by the desk from the league's own numbers and words: who has the man, what he scored for
// them and whom they play, or that he is a free agent. Nothing that goes stale before the gameweek ends: a tie's running
// score, its men to play and a margin are the fixture list's. Each head-to-head is named once a page.

/** "eight points", "13 points", "minus one point", "no points". */
export function leaguePoints(n: number): string {
  if (n === 0) return "no points";
  return `${n < 0 ? "minus " : ""}${numeral(Math.abs(n))} ${plural(Math.abs(n), "point")}`;
}

const tieKey = (a: string, b: string) => [a, b].sort().join("\u0000");

/** A finished tie's result from his side, higher figure first: "beat test2 38-34"; null while it runs or unread. */
function result(h: HeadToHeadStake): string | null {
  if (!h.over || h.us === null || h.them === null) return null;
  const score = `${Math.max(h.us, h.them)}-${Math.min(h.us, h.them)}`;
  return h.us > h.them ? `beat ${h.opponent} ${score}` : h.us < h.them ? `lost ${score} to ${h.opponent}` : `drew ${score} with ${h.opponent}`;
}

/** " against test2 and test3" while the ties run; ", and beat test2 38-34" once they are done. */
function ties(own: readonly HeadToHeadStake[]): string {
  if (own.length === 0) return "";
  const done = own.map(result);
  return done.every((r) => r !== null) ? `, and ${listed(done as string[])}` : ` against ${listed(own.map((h) => h.opponent))}`;
}

/** What the man is to the league, named as `who`: "him" alone, his surname among others. Every stake gives his points: a
 *  man without them is a bug upstream, never a line to print. */
function clause(m: ReportMan, who: string, own: readonly HeadToHeadStake[], opens: boolean): string {
  if (m.points === null) throw new Error(`a stake without his points: ${m.name}`);
  const n = leaguePoints(m.points);
  if (m.holder === null) {
    const since = m.dropped === null ? "" : ` since ${m.dropped.team} let him go on ${m.dropped.day}`;
    if (who === "him") return `A free agent${since}${since === "" ? "," : ";"} ${n}${firstLeagueStart(m) ? "; his first league start this season" : ""}`;
    return `${opens ? capital(who) : who}, a free agent${since}, ${n}${firstLeagueStart(m) ? " in his first league start this season" : ""}`;
  }
  const { team, since, fielded } = m.holder;
  const has = since === null ? `${team} has ${who}` : `${team} claimed ${who} on ${since}${fielded ? "" : " and has him"}`;
  return `${has}${fielded ? "" : " on the bench"}, for ${n}${ties(own)}`;
}

/** Every section's stake on the day's page, match by match: each head-to-head named once, on a section with both its sides
 *  or else its weightiest, by the last of its men there. */
export function dayStakes(day: readonly (readonly SectionPick[])[]): string[][] {
  // A section with both sides of a tie owns it; else the weightiest with either.
  const owner = new Map<string, SectionPick>();
  const rank = (pick: SectionPick, key: string) => (pick.men.filter((m) => key.split("\u0000").includes(m.holder?.team ?? "")).length > 1 ? 1000 : 0) + pick.weight;
  for (const pick of day.flat()) {
    for (const m of pick.men) {
      for (const h of m.holder?.h2h ?? []) {
        const key = tieKey(m.holder?.team ?? "", h.opponent);
        const held = owner.get(key);
        if (held === undefined || rank(held, key) < rank(pick, key)) owner.set(key, pick);
      }
    }
  }
  return day.map((picks) =>
    picks.map((pick) => {
      const told = new Set<string>();
      const owned = [...pick.men].reverse().map((m) =>
        (m.holder?.h2h ?? []).filter((h) => {
          const key = tieKey(m.holder?.team ?? "", h.opponent);
          if (owner.get(key) !== pick || told.has(key)) return false;
          return told.add(key);
        }),
      ).reverse();
      const alone = pick.men.length === 1;
      return `${pick.men.map((m, i) => clause(m, alone ? "him" : m.surname, owned[i], i === 0)).join("; ")}.`;
    }),
  );
}
