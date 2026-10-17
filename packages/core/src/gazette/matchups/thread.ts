import { DRAFT_NEWS } from "../../config";
import type { DraftMan } from "./types";

// One thread a match-up's story could be told through: its kind and family, whom it is about, what it is worth, the
// beat it belongs in and its facts. The weights are DRAFT_NEWS's. Pure.

export type ThreadKind = keyof typeof DRAFT_NEWS.weight;

/** What kind of story a thread tells: a page, and a side's next report, do not tell one family twice running. */
export type Family = "turn" | "decider" | "margin" | "star" | "setback" | "people" | "season" | "upset";

const FAMILY: Record<ThreadKind, Family> = {
  "bench-turned": "turn", "bench-cost": "turn",
  "same-match": "people",
  "late-decider": "decider", "match-winner": "decider", "late-goal": "decider", crossfire: "decider",
  level: "margin", close: "margin", rout: "margin",
  "one-man-show": "star", haul: "star", "keeper-haul": "star", "star-blank": "star",
  injury: "setback", "clean-lost-late": "setback", "uncovered-blank": "setback", "early-off": "setback", "non-starter": "setback", "bench-six": "setback",
  "old-boy": "people", "new-arrival": "people", debut: "people", "club-mates": "people", double: "people",
  top: "season", "stayed-top": "season", "meetings-won": "season", record: "season", "streak-ended": "season", "return-to-form": "season", bottom: "season", streak: "season", "season-high": "season",
  "season-low": "season", climb: "season", fall: "season",
  upset: "upset",
};

/** The match's shape outranks a man's, and a man's the season's, when two threads score alike. */
type Scope = "match" | "man" | "season";
const MATCH: readonly ThreadKind[] = ["bench-turned", "bench-cost", "late-decider", "one-man-show", "level", "close", "upset", "rout", "match-winner", "same-match"];

export interface Thread {
  kind: ThreadKind;
  family: Family;
  scope: Scope;
  /** The side it is about; null for the match-up as a whole. */
  teamId: string | null;
  /** The men it is about, the one it is most about first. */
  men: DraftMan[];
  weight: number;
  /** It decided the result, or reached the margin. */
  decisive: boolean;
  /** When it happened, never printed: a London day, null for the substitutions; undefined for none, the season and the
   *  margin. A twist comes at another moment than its story. */
  beat: string | null | undefined;
  /** Its facts, in the brief's words. */
  facts: string[];
}

/** A thread of a kind at its weight, the bigger one when there is one and `bigger` says so. */
export function thread(kind: ThreadKind, init: { teamId: string | null; facts: string[]; men?: DraftMan[]; beat?: string | null; bigger?: boolean; weight?: number }): Thread {
  const [base, big] = DRAFT_NEWS.weight[kind] as readonly number[];
  const scope: Scope = MATCH.includes(kind) ? "match" : FAMILY[kind] === "season" ? "season" : "man";
  return { kind, family: FAMILY[kind], scope, teamId: init.teamId, men: init.men ?? [], weight: init.weight ?? (init.bigger === true ? (big ?? base) : base), decisive: false, beat: init.beat, facts: init.facts };
}
