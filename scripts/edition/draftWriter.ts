import {
  derbyNames,
  DRAFT_JUDGE_QUOTES,
  DRAFT_NEVER,
  DRAFT_WRITING,
  AMERICAN,
  applyDraftFixes,
  applyFactFixes,
  knownFixes,
  readFactFixes,
  faultyDraftSentences,
  buildDraftBrief,
  checkDraft,
  draftBlocks,
  draftCargo,
  everyMan,
  fanHeadline,
  headlineEcho,
  matchupOf,
  mergeDraft,
  NEWSROOM,
  overTheLead,
  readDraftWriting,
  readHeadlines,
  recordOrEmpty,
  strike,
  stringOrEmpty,
  surname,
  toldBlock,
  unbriefedNames,
  type Fault,
  type MatchupContext,
  type PastProse,
  type ToldSection,
} from "@epl/core";
import { helperFailed, writeColumn, type Say } from "./newsroom";
import { lineEditBrief, serious } from "./sendBack";
import { DRAFT_FACTS_VOICE, DRAFT_JUDGE_VOICE, DRAFT_VOICE, draftSendBack } from "./voice/draft";
import { LINE_EDIT_VOICE, PUN_VOICE } from "./voice/reports";

// The draft report's newsroom, the Prem report's in miniature: the reporter writes the gameweek's match-ups, the editor
// checks each against its block, the pun writer offers headlines, a manager in the league picks one and flags what no
// manager would say, it goes back once, and each match-up keeps its better attempt.

const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export interface DraftJob {
  gameweek: number;
  /** The lead first. */
  contexts: MatchupContext[];
  rankAfter: Map<string, number>;
  /** The headlines of the reports filed before this one, newest first: a pun on one of their words is struck. */
  pastHeadlines: string[];
  /** Those reports' words by match-up, which this one may not echo. */
  pastProse: PastProse[];
  /** What this gameweek's Prem Reports printed of the league's men, which this one does not retell. */
  told: ToldSection[];
}

/** The judge's quotes, capped per match-up; a quote not in the writing is dropped. */
function judgeFlags(raw: Record<string, unknown>, prose: ReadonlyMap<number, string>): Fault[] {
  const flags = Array.isArray(raw.flags) ? raw.flags : [];
  const kept = new Map<number, number>();
  return flags.flatMap((f): Fault[] => {
    const r = recordOrEmpty(f);
    const n = Number(r.number);
    const quote = stringOrEmpty(r.quote).trim();
    if (quote === "" || !(prose.get(n) ?? "").includes(quote) || (kept.get(n) ?? 0) >= DRAFT_JUDGE_QUOTES) return [];
    kept.set(n, (kept.get(n) ?? 0) + 1);
    return [{ section: `${n}:matchup`, check: "a manager in the league would not say this", severity: "send-back", evidence: `${quote} (${stringOrEmpty(r.why)})` }];
  });
}

/** `sendBack: false` is test mode's: the first attempt files with its faults logged, and one call is saved. */
export async function draftColumn(job: DraftJob, say: Say, options: { sendBack?: boolean } = {}): Promise<Record<string, unknown>> {
  const failed = <T,>(step: string, instead: T) => helperFailed(say, "draft report", step, instead);
  const brief = [buildDraftBrief(job.gameweek, job.contexts), toldBlock(job.told)].filter((block) => block !== null).join("\n\n");
  const blocks = draftBlocks(job.contexts);
  const men = job.contexts.flatMap((c) => everyMan(c.state));
  const surnames = men.map((m) => surname(m.name));
  // A headline may name a side, a man, his club or a day; anything else capitalised is a name the facts do not carry.
  const names = [...job.contexts.flatMap((c) => [c.state.home.side.name, c.state.away.side.name, ...derbyNames(c.derby)]), ...men.flatMap((m) => [m.name, m.club]), ...WEEKDAYS];

  const first = readDraftWriting(await writeColumn(DRAFT_VOICE, brief, "draft", NEWSROOM.draftTokens), surnames);
  const faults1 = checkDraft(first, job.contexts, blocks, job.pastProse, job.told);

  // The pun writer's go on the lead match-up's story as the desk chose it, and the surnames of the men it is told through.
  const angle = job.contexts[0]?.angle ?? null;
  const story = angle === null ? first.headlineStory : angle.story.facts.join("; ");
  const cast = angle === null ? "" : `\nTHE CAST: ${angle.cast.map((m) => surname(m.name)).join(", ")}`;
  const puns = await writeColumn(PUN_VOICE, `THE STORY: ${story}${cast}\n\n${blocks[0] ?? ""}`, "helper").then(readHeadlines).catch(failed("pun writer", { headlines: [], meanings: {} }));
  const offered = [...first.headlines, ...puns.headlines.filter((h) => !first.headlines.includes(h))].slice(0, DRAFT_WRITING.headlines + DRAFT_WRITING.puns);
  const meanings = { ...first.meanings, ...puns.meanings };
  // A pun on a word a recent headline used is the same joke twice.
  const why = (h: string) => strike(h, names) ?? (headlineEcho(h, job.pastHeadlines) === null ? null : `"${headlineEcho(h, job.pastHeadlines)}" again`);
  const candidates = offered.filter((h) => why(h) === null);
  for (const h of offered) say(`    headline candidate: "${h}"${candidates.includes(h) ? "" : ` struck (${why(h)})`} [${meanings[h] ?? ""}]`);

  const prose = new Map([...first.matchups].map(([n, p]) => [n, p.paragraphs.join("\n")]));
  const judged = [`HEADLINE CANDIDATES for the lead match-up (${first.headlineStory}):`, ...candidates.map((h, i) => `${i + 1}. ${h} [${meanings[h] ?? ""}]`), "", ...[...prose].map(([n, text]) => `MATCH-UP ${n}:\n${text}`)].join("\n");
  const judgeRaw = await writeColumn(DRAFT_JUDGE_VOICE, judged, "helper").catch(failed("judge", null));
  const chosen = judgeRaw === null ? null : fanHeadline(judgeRaw, candidates);
  const flags = judgeRaw === null ? [] : judgeFlags(judgeRaw, prose);

  const sendable = serious([...faults1, ...flags]);
  const attempts = [{ writing: first, faults: [...faults1, ...flags] }];
  if (sendable.length > 0 && options.sendBack !== false) {
    say(`  ↩ draft report: ${sendable.length} faults, sent back once`);
    const again = await writeColumn(DRAFT_VOICE, `${brief}\n\n${draftSendBack(sendable)}`, "draft", NEWSROOM.draftTokens).catch(failed("rewrite", null));
    if (again !== null) {
      const second = readDraftWriting(again, surnames);
      attempts.push({ writing: second, faults: checkDraft(second, job.contexts, blocks, job.pastProse, job.told).filter((f) => second.matchups.has(matchupOf(f.section)) || f.section === "page") });
    }
  }
  const merged = mergeDraft(attempts, job.contexts.length);
  // The sub-editor's last pass, on the cheap model: a sentence still carrying a banned phrase goes back alone.
  // American words go back too, and a first name the brief never gave.
  const invented = job.contexts.flatMap((ctx, at) => unbriefedNames((merged.get(at + 1)?.paragraphs ?? []).join("\n"), ctx, blocks[at] ?? ""));
  const never = [...DRAFT_NEVER, ...AMERICAN, ...invented];
  const fixes = faultyDraftSentences(merged, never, names);
  const edited = fixes.length === 0 ? null : await writeColumn(LINE_EDIT_VOICE, lineEditBrief(fixes), "helper").catch(failed("line edit", null));
  const pieces = edited === null ? merged : applyDraftFixes(merged, fixes, Array.isArray(edited.lines) ? edited.lines.map(String) : [], never, names);
  if (fixes.length > 0) say(`  draft report: line edit fixed ${fixes.length - faultyDraftSentences(pieces, never, names).length} of ${fixes.length} sentences`);
  // What the desk can put right without a model first: a wrong position word, a man on a day he did not play.
  const known = applyFactFixes(pieces, knownFixes(pieces, job.contexts, blocks), job.contexts, blocks);
  say(`  draft report: the desk's own fact fixes, ${known.made}`);
  // The fact checker's read of the printed words against each block, on the cheap model: a claim it cannot put right goes.
  const printed = [...known.pieces].map(([n, p]) => `MATCH-UP ${n}:\nBRIEF:\n${blocks[n - 1] ?? ""}\n\nPRINTED:\n${p.paragraphs.join("\n")}`).join("\n\n=====\n\n");
  // Checking every claim is slow thinking: GW5's spent the whole default budget (8,000 then) before answering.
  const checked = await writeColumn(DRAFT_FACTS_VOICE, printed, "helper", DRAFT_WRITING.factTokens).catch(failed("fact check", null));
  const factual = checked === null ? known : applyFactFixes(known.pieces, readFactFixes(checked), job.contexts, blocks);
  say(`  draft report: fact check ${checked === null ? "unavailable" : `made ${factual.made} fixes`}`);
  for (const f of serious(attempts.at(-1)!.faults)) say(`    fault ${f.section}: ${f.check} [${f.evidence}]`);
  const lead = job.contexts[0]?.state.score ?? "";
  const headline = overTheLead(chosen, (factual.pieces.get(1)?.paragraphs.length ?? 0) > 0);
  say(`  draft report: ${pieces.size} of ${job.contexts.length} match-ups written; headline ${headline === null ? `${chosen === null ? "none chosen" : `"${chosen}" dropped over the lead's plain line`}, the lead result prints` : `"${headline}"`}`);
  // A pun's deck is the lead result; a plain headline already is it, so its deck carries the gameweek's other results.
  const others = job.contexts.slice(1).map((c) => c.state.score).join("; ");
  return { headline: headline ?? lead, deck: headline === null ? others : lead, body: "", draft: draftCargo(job.gameweek, job.contexts, factual.pieces, job.rankAfter) };
}
