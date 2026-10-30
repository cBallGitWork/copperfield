import type { Fault } from "@epl/core";
import { writeColumn, type Say, type Tier } from "./newsroom";

// The editor's send-back: a column whose serious faults call for it is written once more, and the log says why.

/** The faults worth a rewrite: a hard one or a send-back, never a warning. */
export function serious<F extends Pick<Fault, "severity">>(faults: readonly F[]): F[] {
  return faults.filter((fault) => fault.severity !== "warn");
}

/** The first six faults as the log names them: `check (evidence)`. */
export function faultSummary(faults: readonly Fault[]): string {
  return faults.slice(0, 6).map((fault) => `${fault.check} (${fault.evidence})`).join(", ");
}

/** One desk's column: what it is written from, how its faults are read, and what the writer is told on a send-back. */
interface SendBack<A> {
  /** The desk as the log names it: `bin-xi`, `lawro`. */
  desk: string;
  voice: string;
  brief: string;
  read: (raw: Record<string, unknown>) => A;
  sendBack: (faults: readonly Fault[]) => string;
  /** The log's list of faults, where a desk prints more than `faultSummary` does. */
  summary?: (faults: readonly Fault[]) => string;
  /** Which model writes it: the writer, unless a short desk asks for the helper. */
  tier?: Tier;
  /** The call's budget, thinking included, where a desk needs more than the newsroom's default. */
  maxTokens?: number;
}

/** The column read, then, when its serious faults send it back, the rewrite read after it; a failed rewrite leaves one. */
export async function sendBackOnce<A extends { faults: readonly Fault[] }>(job: SendBack<A>, say: Say): Promise<A[]> {
  const attempts = [job.read(await writeColumn(job.voice, job.brief, job.tier ?? "writer", job.maxTokens))];
  const faults = serious(attempts[0].faults);
  if (faults.length > 0) {
    say(`  ↩ ${job.desk}: ${faults.length} faults, sent back once: ${(job.summary ?? faultSummary)(faults)}`);
    const second = await writeColumn(job.voice, `${job.brief}\n\n${job.sendBack(faults)}`, job.tier ?? "writer", job.maxTokens).catch((error: unknown) => {
      say(`  ⚠ ${job.desk} rewrite failed, filing the first column: ${error instanceof Error ? error.message : String(error)}`);
      return null;
    });
    if (second !== null) attempts.push(job.read(second));
  }
  return attempts;
}

/** Every fault, quoted, and the rest of the column kept. */
export function faultsSendBack(faults: readonly Fault[], label: (section: string) => string): string {
  const lines = faults.map((fault) => `- ${label(fault.section)}: ${fault.check}${fault.evidence === "" ? "" : `, "${fault.evidence}"`}`);
  return `YOUR LAST ATTEMPT BROKE THESE RULES. Write every paragraph again, fixing each one without reaching for a synonym:\n${lines.join("\n")}`;
}

/** The line editor's brief: each sentence numbered, the words it must lose in brackets. */
export function lineEditBrief(fixes: readonly { sentence: string; words: readonly string[] }[]): string {
  return fixes.map((f, i) => `${i + 1}. ${f.sentence} [${f.words.join(", ")}]`).join("\n");
}
