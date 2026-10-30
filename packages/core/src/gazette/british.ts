import { REPORT_AMERICAN } from "./reports/words";
import { SHEETS_AMERICAN } from "./sheets/words";

// British football English, one list every desk checks (Craig, 13 Oct 2026: "we are uk"). Researched against 2026/27
// Sky Sports, PA and Fantasy Football Scout copy; a word a British writer also uses (a cup tie, practice the noun, a
// loss of form, a fall in the table) is left off, since a send-back that calls good copy American is wrong.

/** American idiom a model reaches for in any column: first written for Lawro, now every byline's. */
const IDIOM: readonly string[] = [
  "lean on", "leans on", "leaning on", "step up", "steps up", "stepped up", "show up", "shows up", "showed up",
];

/** American sport, with the British for it in the voice (`BRITISH` in the house prompt). */
const SPORT: readonly string[] = [
  "tie game", "tied game", "ended in a tie", "played to a tie", "knotted", "two-nothing", "one-nothing", "three-nothing",
  "field player", "jerseys", "fullback", "fullbacks", "wingback", "wingbacks", "outside back", "end line", "endline",
  "bicycle kick", "in regulation", "regulation time", "hat trick", "playoff", "playoffs", "postseason", "regular season",
  "win-loss", "winning record", "losing record", "games back", "games behind", "magic number", "homestand", "home stand",
  "road loss", "road record", "road form", "franchise", "franchises", "front office", "general manager",
  "ownership group", "MVP", "all-star", "player of the game", "sophomore", "three-peat", "role player", "bench player",
  "sixth man", "healthy scratch", "injured reserve", "at practice", "missed practice", "playmaking", "make plays",
  "made plays", "big play", "insurance goal", "garbage time", "walk-off", "buzzer-beater", "laugher", "barn-burner",
  "slugfest", "squeaker", "erupted for", "exploded for", "stat line", "statline", "box score", "stat sheet", "playbook",
  "Hail Mary", "slam dunk", "home run", "curveball", "out of left field", "ballgame", "full-court press", "this fall",
  "a couple games", "a couple weeks", "a couple minutes", "awesome",
];

/** American spelling past the -ize rule and the team sheets' list. */
const SPELLING: readonly string[] = [
  "analyze", "analyzed", "paralyzed", "behavior", "endeavor", "humor", "harbor", "neighbors", "honors", "honored",
  "colored", "favored", "favorable", "theater", "catalog", "fiber", "aging", "maneuver", "jewelry", "defenses",
  "offenses", "skeptical", "modeling", "traveler", "leveling", "labeling", "fueling",
];

/** Not British English: the team sheets' American words, the match report's, and the idiom, sport and spelling above. */
export const AMERICAN: readonly string[] = [...new Set([...SHEETS_AMERICAN, ...REPORT_AMERICAN, ...IDIOM, ...SPORT, ...SPELLING])];

/** The few American words the house prompt names as examples, each one on AMERICAN so each is checked. */
export const AMERICAN_EXAMPLES: readonly string[] = [
  "roster", "lineup", "matchup", "starter", "rookie", "playoff", "overtime", "road win", "tie game", "shut-out",
  "step up", "lean on", "show up",
];
