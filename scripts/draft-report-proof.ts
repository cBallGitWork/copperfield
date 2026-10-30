import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  FANTRAX_LEAGUE_ID,
  buildDraftBrief,
  draftCargo,
  draftFace,
  requireLeague,
  returnText,
  rowNote,
  type MatchupContext,
  type StoryDraftMatchup,
  type Thread,
  type StoryDraftReport,
  type StoryDraftRow,
} from "@epl/core";
import { draftDesk } from "./edition/draftDesk";
import { toldThisGameweek } from "./edition/draftPast";
import { draftColumn } from "./edition/draftWriter";
import { spentSince, storyOfColumn, tokensLine, tokensSpent } from "./edition/newsroom";
import { STORY_BYLINE, editionName } from "./edition/voice/bylines";

// The draft report for a past gameweek, never filed. No GAZETTA_PROOF_OUT prints the brief and calls no model; with one,
// it is written there as brief, plain read and story file. Test mode unless
// GAZETTA_FULL=1: the lead match-up only (GAZETTA_TEST_MATCHUPS for more) and no send-back.

const say = (line: string) => process.stdout.write(`${line}\n`);

const row = (r: StoryDraftRow) => `  ${r.slot} ${r.mark === "sub" ? "SUB " : ""}${r.name} ${r.points ?? "—"}${rowNote(r) === null ? "" : `, ${rowNote(r)}`}`;

/** What the page sets out around the writing: each side's returns, and after the story both elevens. */
function page(m: StoryDraftMatchup): { head: string[]; foot: string[] } {
  const sides = [m.home, m.away];
  const returns = sides.map((s) => `${s.name}: goals ${s.returns.goals.map(returnText).join(", ") || "—"}; assists ${s.returns.assists.map(returnText).join(", ") || "—"}; clean sheets ${s.returns.cleanSheets.map(returnText).join(", ") || "—"}`);
  return { head: returns, foot: sides.flatMap((s) => [`${s.name}:`, ...s.eleven.map(row)]) };
}

/** What the desk decided each match-up's story is, for reading before any model is called. */
function angleText(ctx: MatchupContext, at: number): string {
  const a = ctx.angle;
  if (a === null) return `${at + 1}. ${ctx.state.score}: no story chosen`;
  const line = (label: string, t: Thread) => `  ${label}: ${t.kind} ${t.weight}${t.decisive ? ", decisive" : ""}, ${t.beat === undefined ? "no beat" : (t.beat ?? "the substitutions")}: ${t.facts.join("; ")}`;
  const told = [line("THE STORY", a.story), ...(a.twist === null ? [] : [line("TWIST", a.twist)]), ...a.supporting.map((t) => line("supporting", t))];
  return [`${at + 1}. ${ctx.state.score} (score ${a.score})`, ...told, `  cast: ${a.cast.map((m) => m.name).join(", ")}`].join("\n");
}

/** The report as plain text, for reading before looking at the page. */
function plain(headline: string, draft: StoryDraftReport): string {
  return [...(headline === "" ? [] : [headline, ""]), ...draft.matchups.flatMap((m) => [`## ${m.verdict}`, ...page(m).head, "", m.standfirst, ...m.paragraphs, "", ...page(m).foot, ""])].join("\n");
}

async function main(): Promise<void> {
  if (process.env.CI) throw new Error("draft:proof is a local proof and never runs in CI.");
  requireLeague(FANTRAX_LEAGUE_ID);
  const gameweek = Number(process.env.GAZETTA_GAMEWEEK);
  if (!Number.isInteger(gameweek)) throw new Error("GAZETTA_GAMEWEEK names the gameweek to read.");
  const desk = await draftDesk(gameweek);
  say([`League ${FANTRAX_LEAGUE_ID}, period ${desk.period}, gameweek ${gameweek}; played on ${desk.days.join(", ")}.`, ...desk.notes].join("\n"));
  const out = process.env.GAZETTA_PROOF_OUT ?? "";
  const test = process.env.GAZETTA_FULL !== "1";
  if (desk.contexts.length === 0) {
    say("Nothing due.");
    return;
  }
  const contexts = test ? desk.contexts.slice(0, Number(process.env.GAZETTA_TEST_MATCHUPS ?? 1)) : desk.contexts;
  if (out === "") {
    say(`\n########## END OF THE GAMEWEEK ##########\n\n${buildDraftBrief(gameweek, contexts)}`);
    say(`\n---------- THE DESK'S STORIES ----------\n\n${contexts.map(angleText).join("\n\n")}`);
    say(`\n---------- THE PAGE, unwritten ----------\n\n${plain("", draftCargo(gameweek, contexts, new Map(), desk.rankAfter))}`);
    return;
  }
  const mark = tokensSpent();
  const column = await draftColumn({ gameweek, contexts, rankAfter: desk.rankAfter, pastHeadlines: desk.pastHeadlines, pastProse: desk.pastProse, told: toldThisGameweek(gameweek) }, say, { sendBack: !test });
  say(`  draft report: ${tokensLine(spentSince(mark))}`);
  const slug = `proof-gw${gameweek}-draft-report`;
  const filedAt = new Date().toISOString();
  const { story } = storyOfColumn(column, {
    slug, kind: "draft-report", leagueId: FANTRAX_LEAGUE_ID, period: desk.period, gameweek, filedAt, expiresAt: null,
    edition: editionName("draft-report", filedAt, desk.days.at(-1)!), byline: STORY_BYLINE["draft-report"] ?? "", subject: `draft-report:gw${gameweek}:gameweek`, face: draftFace(contexts),
  });
  mkdirSync(out, { recursive: true });
  writeFileSync(join(out, `${slug}.brief.txt`), buildDraftBrief(gameweek, contexts));
  writeFileSync(join(out, `${slug}.txt`), plain(story.headline, column.draft as StoryDraftReport));
  writeFileSync(join(out, `${slug}.story.json`), JSON.stringify(story, null, 2));
  say(`Wrote ${slug} to ${out}${test ? " (test mode)" : ""}.`);
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.stack : String(error)}\n`);
  process.exit(1);
});
