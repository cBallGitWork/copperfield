import { REPORT_CROWD } from "../reports/words";
import { REPORT_NEVER } from "../reports/style";

/** "Dons'", "Notemail's". */
export const possessive = (name: string) => (name.endsWith("s") ? `${name}'` : `${name}'s`);

/** Football Manager's words a draft report may frame a fact with: each only in a sentence that states the fact it
 *  frames, about a side, never a quote or a named person's feeling. */
export const DRAFT_FRAMES: readonly string[] = [
  "the terraces", "the boardroom", "the board", "the dugout", "pressure", "under pressure", "the hot seat",
  "top of the pile", "bottom of the pile", "pressure mounts",
];

/** What a draft report never prints: invented speech, a press conference, and the league's own banned words. */
const DRAFT_SPEECH: readonly string[] = [
  "said", "says", "told", "admitted", "insisted", "claimed", "revealed", "press conference", "presser", "asked about",
  "held him", "holds him", "held and",
];

/** Who is still to play is the fixture list, never a manager's choice. */
const DRAFT_CHOICE: readonly string[] = [
  "keep back", "keeps back", "kept back", "held back", "holding back", "saving", "saved for", "in reserve", "waiting for", "waiting in",
  "chose", "chosen", "choose", "picked", "selected", "opted",
];

/** Why a man did not play is not in the facts: the brief says he did not, and nothing more. */
const DRAFT_REASONS: readonly string[] = ["left out", "absent", "missing", "dropped", "rested", "benched", "omitted", "sidelined", "unavailable", "missed out"];

/** The brief's own labels, which a writer copies into print, and titles the league has not given ("the champions"). */
export const DRAFT_LABELS: readonly string[] = ["the twist", "the cast", "may be left out", "beats", "champion", "champions", "title holders", "the holders"];

/** A minute belongs to its own match, never measured against another's. */
const DRAFT_CLOCK: readonly string[] = [
  "minutes earlier", "minutes later", "minutes before", "minutes after", "minute earlier", "minute later",
  "minutes-earlier", "minutes-later", "minute-earlier", "minute-later",
];

/** Who led on a day is the fixture list's (Craig, 13 Oct 2026): never a day, a day's score, or a lead on the move. */
const DRAFT_SCOREBOARD: readonly string[] = [
  "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday",
  "first day", "second day", "third day", "opening day", "final day", "day one", "won the day", "the day finished", "the day ended",
  "cut the gap", "closed the gap", "gap grew", "lead grew", "pulled away", "pulled clear", "stretched", "edged ahead", "overtook",
  "reeled in", "clawed back", "closed to", "cushion", "still led", "drew level", "built their whole margin", "stayed there",
  // A man's points set against the margin is a sum, not a story (Craig, 14 Oct 2026: "what margin").
  "the margin",
];

/** The Prem report's never-list with the FM framing words let back in, and the speech, invented reasons, the brief's
 *  labels, another match's clock and the scoreboard by day added. */
export const DRAFT_NEVER: readonly string[] = [
  ...REPORT_NEVER.filter((phrase) => !REPORT_CROWD.includes(phrase) || !DRAFT_FRAMES.some((frame) => phrase.includes(frame))),
  ...DRAFT_SPEECH,
  ...DRAFT_REASONS,
  ...DRAFT_CHOICE,
  ...DRAFT_LABELS,
  ...DRAFT_CLOCK,
  ...DRAFT_SCOREBOARD,
];
