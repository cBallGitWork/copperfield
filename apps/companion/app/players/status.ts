// Fantrax's own status vocabulary, in the manager's words: the board's chips and every holder's title.

/** Fantrax's status codes in the manager's words; a code not here prints as itself, never a guess. */
export const STATUS: Record<string, string> = {
  FA: "Free agent",
  WW: "On waivers",
  T: "Rostered",
};

/** The statuses of a man anybody can claim: the row's one chip for the bin, and where Players rests (Craig, 16 Oct 2026). */
export const FREE: readonly string[] = ["FA", "WW"];

/** The bin's chip, which stands for both of `FREE`. */
export const FREE_CHIP = "Free";

/** A status as its own chip says it: the code the rows print in brackets, and Craig's word for the one they never
 *  print. Anything else is its raw code. */
export const STATUS_CHIP: Record<string, string> = {
  FA: "FA",
  WW: "WW",
  T: "Owned",
};
