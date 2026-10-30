import { DASH } from "@epl/core";
import { shortName } from "./teamNames";

// Who holds a man, in the league's words: the reader's own, a rival's, or one anybody can claim.

/** The reader's own man, on every screen. */
export const YOURS = "Yours";

/** Fantrax's status codes written out; a code not here prints as itself, never a guess. */
export const STATUS: Record<string, string> = {
  FA: "Free agent",
  WW: "On waivers",
  T: "Rostered",
};

/** The statuses of a man anybody can claim: the board's one chip for the bin, and where Players rests (Craig, 16 Oct 2026). */
export const FREE: readonly string[] = ["FA", "WW"];

/** The board's chip for the bin, which stands for both of `FREE`. */
export const FREE_CHIP = "Free";

/** A status on a board's chip: Fantrax's code, and Craig's word for the one the rows never print. */
export const STATUS_CHIP: Record<string, string> = {
  FA: "FA",
  WW: "WW",
  T: "Owned",
};

export interface OwnerWords {
  kind: "yours" | "rival" | "free";
  /** Short, for a board's brackets: "Yours", a short team name, "FA" or "WW". */
  chip: string;
  /** Written out: "Yours", the full team name, "Free agent" or "On waivers". */
  label: string;
}

/** Who holds him in both forms; a dash for a team whose name failed to load, null for a man with neither holder nor status. */
export function ownerWords(
  ownerTeamId: string | null,
  status: string,
  reader: string | null,
  teamNames: ReadonlyMap<string, string>,
): OwnerWords | null {
  if (ownerTeamId !== null && ownerTeamId === reader) return { kind: "yours", chip: YOURS, label: YOURS };
  if (ownerTeamId !== null) {
    const full = teamNames.get(ownerTeamId);
    return full === undefined
      ? { kind: "rival", chip: DASH, label: DASH }
      : { kind: "rival", chip: shortName(ownerTeamId, full), label: full };
  }
  if (!status) return null;
  return { kind: "free", chip: STATUS_CHIP[status] ?? status, label: STATUS[status] ?? status };
}
