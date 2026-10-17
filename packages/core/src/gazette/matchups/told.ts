import type { Fault } from "../predictions/checks";
import { mentionAt, numbersIn, sentences } from "../predictions/prose";
import { blanked } from "../proofing";
import type { StoryReport } from "../reports/cargo";
import type { MatchupContext } from "./brief";
import { SIDE_ELEVEN, menOf, named } from "./listChecks";
import type { DraftPiece } from "./writing";

// What the gameweek's Prem Reports already printed about the league's men: the draft report tells a man through what he
// decided in his match-up, never his points again (16 Oct 2026: nine men told twice, with the same figures).

export type ToldSection = StoryReport["sections"][number];

/** The brief's block: each man's line as a Prem Report printed it; null when none filed this gameweek. */
export function toldBlock(told: readonly ToldSection[]): string | null {
  if (told.length === 0) return null;
  return [
    "ALREADY PRINTED THIS GAMEWEEK in the Prem Reports, a man and his line. Never retell one: name him for what he decided in this match-up, never his points or his haul again.",
    ...told.map((s) => `- ${s.head}: ${s.stake}`),
  ].join("\n");
}

/** Each sentence naming one man alone with his points, where a Prem Report printed his name and those points. */
export function retold(piece: DraftPiece, ctx: MatchupContext, at: number, told: readonly ToldSection[]): Fault[] {
  const men = menOf(ctx);
  const names = [...men.flatMap((m) => m.names), ctx.state.home.side.name, ctx.state.away.side.name];
  const printed = told.map((s) => `${s.head}. ${s.pitch} ${s.stake}`);
  return sentences(piece.paragraphs.join("\n")).flatMap((sentence): Fault[] => {
    const who = named(sentence, men);
    const man = who.length === 1 ? who[0] : undefined;
    if (man === undefined || man.man.points === null) return [];
    const points = man.man.points;
    if (!numbersIn(blanked(sentence.replace(SIDE_ELEVEN, " "), names)).includes(points)) return [];
    const before = printed.some((text) => man.names.some((n) => mentionAt(text, n) >= 0) && numbersIn(blanked(text, names)).includes(points));
    return before ? [{ section: `${at + 1}:matchup`, check: "a man's points a Prem Report already printed", severity: "send-back", evidence: sentence }] : [];
  });
}
