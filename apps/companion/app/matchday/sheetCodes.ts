import { type FootballPlayer, type RawPlFixture, plPlayerCodes } from "@epl/core";
import { optaToCode, plFixture, plRound, playerCodes } from "../plFeed";
import { orDegraded } from "../refusals";

// The goals' identity join: the bridge, plus every man the round's team sheets name, so a man the bridge has not
// harvested yet still has a name beside his goal, as he does on the match page.

/** The bridge's Premier League id → FPL code, with each team sheet's men added. */
export function withSheets(
  codes: ReadonlyMap<number, number>,
  details: readonly RawPlFixture[],
  opta: Map<string, number>,
): Map<number, number> {
  const merged = new Map(codes);
  for (const detail of details) {
    for (const [id, code] of plPlayerCodes(detail, opta)) merged.set(id, code);
  }
  return merged;
}

/** One round's join, off the detail reads its commentary already makes; the bridge alone when their API is down. */
export async function roundCodes(gameweek: number, players: readonly FootballPlayer[]): Promise<Map<number, number>> {
  const codes = playerCodes(players);
  const round = await orDegraded(plRound(gameweek), () => null);
  if (round === null) return codes;
  const details = await Promise.all(
    round.content.filter((fixture) => fixture.status !== "U").map((fixture) => orDegraded(plFixture(fixture), () => null)),
  );
  return withSheets(codes, details.filter((detail) => detail !== null), optaToCode(players));
}
