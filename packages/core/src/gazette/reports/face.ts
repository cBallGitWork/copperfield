import type { Club, FootballPlayer, FootballSnapshot } from "../../football/types";
import { tokens } from "../../identity/normalize";
import type { StoryFace } from "../face";
import type { PublishedStory } from "../story";
import type { StoryReport, StoryReportSide } from "./cargo";
import type { StoryLineup } from "./lineups";
import { surname } from "../../names";

// The Prem Report's picture: the first man its headline names who played that day, else the day's top scorer. Read off the
// filed report, so a story filed before it was stored is pictured at render the same way.

/** A man as the report prints him, and his club's FPL code. */
export interface ReportSubject {
  name: string;
  club: number;
}

/** "Pedro 46", "O'Shea 90+1", "James 80 og": the scorer, or null for an own goal. */
function scorer(goal: string): string | null {
  const read = /^(.*\S)\s+\d+(?:\+\d+)?(\s+(?:og|pen))?$/u.exec(goal);
  return read === null || read[2]?.trim() === "og" ? null : read[1];
}

/** Every man who played: the elevens and whoever came on, never the unused. */
function played(lineup: StoryLineup | null): string[] {
  type On = { name: string; replacedBy?: On | null };
  const chain = (on: On | null | undefined): string[] => (on == null ? [] : [on.name, ...chain(on.replacedBy)]);
  return (lineup?.lines ?? []).flat().flatMap((m) => chain(m));
}

const sides = (reports: readonly StoryReport[]): StoryReportSide[] => reports.flatMap((r) => [r.home, r.away]);

/** Where `name` first stands as whole words in the headline's words, or -1. */
function placeIn(words: readonly string[], name: string): number {
  const want = tokens(name);
  if (want.length === 0) return -1;
  return words.findIndex((_, i) => want.every((w, j) => words[i + j] === w));
}

export function reportSubject(headline: string, reports: readonly StoryReport[]): ReportSubject | null {
  // A possessive is the man: "Pedro's double".
  const words = tokens(headline.replace(/['’]s\b/gu, ""));
  const men = sides(reports).flatMap((s) => played(s.lineup).map((name) => ({ name, club: s.code })));
  const named = men
    .map((m) => ({ m, at: placeIn(words, m.name) }))
    .filter((x) => x.at >= 0)
    .sort((a, b) => a.at - b.at || tokens(b.m.name).length - tokens(a.m.name).length)[0];
  if (named !== undefined) return named.m;

  const goals = new Map<string, { subject: ReportSubject; goals: number }>();
  for (const s of sides(reports)) {
    for (const name of s.goals.flatMap((g) => scorer(g) ?? [])) {
      const key = `${s.code}:${name}`;
      goals.set(key, { subject: { name, club: s.code }, goals: (goals.get(key)?.goals ?? 0) + 1 });
    }
  }
  // A Map keeps first-scored order, so the stable sort gives a tie to the earlier man.
  return [...goals.values()].sort((a, b) => b.goals - a.goals)[0]?.subject ?? null;
}

/** The subject as a face: the footballer at his club whose short name or surname the report printed; null when none. */
export function reportFace(
  headline: string,
  reports: readonly StoryReport[],
  players: readonly FootballPlayer[],
  clubs: readonly Club[],
): StoryFace | null {
  const subject = reportSubject(headline, reports);
  const club = subject === null ? undefined : clubs.find((c) => c.code === subject.club);
  if (subject === null || club === undefined) return null;
  const same = (a: string) => tokens(a).join(" ") === tokens(subject.name).join(" ");
  const squad = players.filter((p) => p.clubId === club.id);
  // His FPL name, else his surname, else inside his full name: "Pedro" is FPL's "João Pedro Junqueira de Jesus".
  const player =
    squad.find((p) => same(p.name)) ??
    squad.find((p) => same(surname(p.fullName))) ??
    squad.find((p) => placeIn(tokens(p.fullName), subject.name) >= 0);
  return player === undefined ? null : { code: player.code, name: player.name, clubId: club.id, position: null };
}

/** A Prem Report given its picture when it has none; every other story as it is. Filing stores it, and the page asks
 *  again for a report filed before it was stored. */
export function withReportFace(story: PublishedStory, snapshot: Pick<FootballSnapshot, "players" | "clubs">): PublishedStory {
  if (story.kind !== "match-report" || story.face !== null) return story;
  const face = reportFace(story.headline, story.extras?.reports ?? [], snapshot.players, snapshot.clubs);
  return face === null ? story : { ...story, face };
}
