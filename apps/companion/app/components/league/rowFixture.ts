import { type SquadPlayerDetail, DASH, fixtureLabel, isResolved } from "@epl/core";

/** A squad row's fixture cell: his club's fixtures, else a quiet word for why there are none. "unmapped" is a slot
 *  with no footballer behind it; a man whose club sits the gameweek out has the dash (DESIGN §7). `difficulty` is FPL's
 *  for his first fixture, which colours the tile (the approved Squad picture); null where there is none. */
export function rowFixture({ rostered, opposition }: Pick<SquadPlayerDetail, "rostered" | "opposition">): {
  text: string;
  quiet: boolean;
  difficulty: number | null;
} {
  if (!isResolved(rostered)) return { text: "unmapped", quiet: true, difficulty: null };
  const fixture = fixtureLabel(opposition);
  return fixture === null
    ? { text: DASH, quiet: true, difficulty: null }
    : { text: fixture, quiet: false, difficulty: opposition?.[0]?.difficulty ?? null };
}
