// The Bin XI's banned vocabulary beyond the match report's advice and FPL lists, which it also runs:
// the market is the wire's ground, the ownership words are never the house's, and neglect is unprovable.

/** Claiming, and the day it happens: never a nudge towards Wednesday. */
export const BIN_MARKET: readonly string[] = [
  "claim", "claims", "claimed", "claiming", "waiver", "waivers", "pick up", "picked up", "snapped up", "grab", "grabbed",
  "add him", "free agent", "free agents", "worth a", "tomorrow", "Wednesday", "value",
];

/** A man is in a squad or a manager has him: never owned, held or rostered. A side still holds a clean sheet. */
export const BIN_OWNERSHIP: readonly string[] = [
  "owned", "owner", "owners", "held him", "holds him", "held by", "held them", "roster", "rostered",
];

/** Why nobody has him is a verdict the facts cannot give: dropped is a fact, unwanted is not. */
export const BIN_NEGLECT: readonly string[] = [
  "unwanted", "nobody wanted", "no one wanted", "unloved", "forgotten", "overlooked", "ignored", "neglected", "passed over",
  "bothered", "thought to", "not a soul", "cast-off", "cast-offs", "rejects", "discarded", "scrapheap",
];

/** The brief gives G, D, M and F; a role is recalled, never read (the house's own rule). */
export const BIN_ROLES: readonly string[] = [
  "wide", "full-back", "full-backs", "wing-back", "wing-backs", "winger", "wingers", "centre-back", "centre-backs",
  "centre-half", "centre-halves", "number nine", "No 9", "No 10", "playmaker", "holding midfielder", "striker",
];

/** The column's premise: the reader knows nobody in the league has these men (Craig, 13 Oct 2026). */
export const BIN_PREMISE: readonly string[] = [
  "nobody in the league has", "no one in the league has", "nobody has him", "no one has him", "nobody has them", "in nobody's squad",
  "none of the ten", "undrafted", "nobody drafted", "went unpicked", "unclaimed", "going begging",
];

/** A gloss on a fact for the reader's benefit, which adds none: the 13 Oct column's padding (16 Oct 2026). */
export const BIN_GLOSS: readonly string[] = [
  "for those who like", "for those who prefer", "for anyone who likes", "came near it", "came close to it", "nothing came near",
  "its spine", "the spine",
];

/** The desk's box keeps its figures, and the draft's round is never printed. */
export const BIN_WORKINGS: readonly string[] = ["expected", "round", "rounds"];
