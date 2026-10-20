import { LAWRO_LIMITS as LIMITS } from "../config";

// The editor's kit every desk shares: a fault, the log it files into, and the sub-editor's pencil.

type Severity = "hard" | "send-back" | "warn";

export interface Fault {
  /** "intro", "deck", "column", or a tie's key. */
  section: string;
  check: string;
  severity: Severity;
  evidence: string;
}

/** Where a check files a fault: the section it is in, the rule, how hard, and the words that broke it. */
export type Report = (section: string, check: string, severity: Severity, evidence: string) => void;

/** Files a fault quoting the words `pattern` finds in `text`, when it finds any. */
export function faultOnMatch(fault: Report, section: string, check: string, severity: Severity, text: string, pattern: RegExp): void {
  const found = text.match(pattern);
  if (found !== null) fault(section, check, severity, found[0]);
}

/** The opening of a section, quoted when no one sentence of it broke the rule. */
export function excerpt(text: string): string {
  return text.slice(0, LIMITS.quote);
}

/** A fresh fault list and the `Report` that files into it. */
export function faultLog(): { faults: Fault[]; fault: Report } {
  const faults: Fault[] = [];
  return { faults, fault: (section, check, severity, evidence) => { faults.push({ section, check, severity, evidence }); } };
}

/** The sub-editor's pencil: the trivial slips fixed rather than sent back. */
export function pencil(text: string): string {
  return text
    .replace(/(\d)\s*[–—]\s*(\d)/gu, "$1-$2")
    .replace(/\s+[—–]\s+|\s+--\s+|—/gu, ", ")
    .replace(/!/gu, ".")
    .replace(/(^|[.?]\s+)So,\s+(\p{Ll})/gu, (_, lead: string, next: string) => `${lead}${next.toUpperCase()}`);
}
