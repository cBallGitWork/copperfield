import type { PoolPlayer } from "@epl/core";
import { ownerWords } from "../ownerWords";

// Who holds a man, as a Data board prints it in brackets after his name.

export type Held = Pick<PoolPlayer, "ownerTeamId" | "status">;

export interface Holder {
  text: string;
  title: string;
  /** The reader's own man, a rival's, or one anybody can claim. */
  tone: "yours" | "rival" | "free";
}

/** "Yours", the holding team's short name, or Fantrax's status code for a man nobody holds; null when it has none, or
 *  when the board is filtered to his one status (`filtered`), which already says it on every row. */
export function holderOf(
  held: Held,
  teamNames: ReadonlyMap<string, string>,
  reader: string | null,
  filtered: readonly string[] = [],
): Holder | null {
  if (held.ownerTeamId === null && filtered.length === 1 && filtered[0] === held.status) return null;
  const words = ownerWords(held.ownerTeamId, held.status, reader, teamNames);
  return words === null ? null : { text: words.chip, title: words.label, tone: words.kind };
}
