import { fantraxDay } from "@epl/core";
import { STATUS } from "../status";
import type { Arrival, PlayerMove } from "./dossier";

const HOW: Readonly<Record<string, string>> = { claim: "Claimed", trade: "Traded" };

/** The Profile's transfer line: for a held man how he joined (the bar names his holder), else his status in the
 *  manager's words; a code not in `STATUS` prints as itself, and none is absent. */
export function holding(owner: string | null, status: string, arrival: Arrival): { label: string; value: string | null } {
  if (owner === null) return { label: "Status", value: STATUS[status] ?? (status || null) };
  if (arrival === "unknown" || !("joined" in arrival)) return { label: "Joined", value: null };
  return { label: "Joined", value: arrival.joined === null ? "In the draft" : joinedBy(arrival.joined) };
}

/** "Claimed, Wed 7 Oct": what, then the London day, which is left off when Fantrax gave none. */
function joinedBy(move: PlayerMove): string {
  const what = HOW[move.transaction.kind] ?? move.transaction.kind;
  return [what, fantraxDay(move.transaction.processedAt ?? "")].filter(Boolean).join(", ");
}
