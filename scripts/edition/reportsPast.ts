import { REPORTS, type PublishedStory } from "@epl/core";
import { readArchive } from "./persist";

// The Prem Reports filed for days before the one being written, newest day first, so a new day does not echo them.

const DAY = /^match-report:gw\d+:(\d{4}-\d{2}-\d{2})$/u;

/** The match day a report covers, from its subject; null for one that names none. */
const dayOf = (story: PublishedStory) => story.subjects.map((s) => DAY.exec(s)?.[1]).find((d) => d !== undefined) ?? null;

/** The writer's words on each earlier day, read as the editor's check reads a page: standfirst, account, heads and pitches. */
export function reportsBefore(stories: readonly PublishedStory[], day: string, most: number): string[] {
  const latest = new Map<string, PublishedStory>();
  for (const story of stories) {
    const covered = dayOf(story);
    if (covered === null || covered >= day) continue;
    if ((latest.get(covered)?.filedAt ?? "") < story.filedAt) latest.set(covered, story);
  }
  return [...latest]
    .sort(([a], [b]) => b.localeCompare(a))
    .slice(0, most)
    .map(([, story]) => (story.extras?.reports ?? []).flatMap((r) => [r.standfirst, r.account, ...r.sections.flatMap((s) => [s.head, s.pitch])]).join("\n"));
}

export const pastReports = (day: string): string[] => reportsBefore(readArchive("match-report"), day, REPORTS.pastDays);
