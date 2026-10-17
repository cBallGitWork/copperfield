import type { Assignment, Cutoff } from "@epl/core";
import { draftDesk } from "./draftDesk";
import { toldThisGameweek } from "./draftPast";
import type { DraftJob } from "./draftWriter";
import type { Say } from "./newsroom";

// The reads behind the draft report a firing commissions, made only when one is assigned.

export async function draftsDesk(input: { assignments: readonly Assignment[]; gameweek: number; say: Say }): Promise<Map<Cutoff, DraftJob>> {
  const jobs = new Map<Cutoff, DraftJob>();
  const wanted = input.assignments.flatMap((a) => (a.kind === "draft-report" && a.cutoff !== undefined ? [a.cutoff] : []));
  if (wanted.length === 0) return jobs;
  const desk = await draftDesk(input.gameweek);
  for (const cutoff of wanted) {
    const contexts = desk.contexts;
    if (contexts.length === 0) {
      input.say(`  draft report: nothing due for ${cutoff} in gameweek ${input.gameweek}. ${desk.notes.at(-1) ?? ""}`);
      continue;
    }
    jobs.set(cutoff, { gameweek: input.gameweek, contexts, rankAfter: desk.rankAfter, pastHeadlines: desk.pastHeadlines, pastProse: desk.pastProse, told: toldThisGameweek(input.gameweek) });
  }
  return jobs;
}
