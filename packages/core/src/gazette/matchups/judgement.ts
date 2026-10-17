// The draft desk's tuning: what makes a match-up's talking point, what each thread is worth, and how long the report runs.

/** The draft match-up desk's talking points. */
export const DRAFT_DESK = {
  /** A man off before this many minutes, with his match done, went off early. */
  earlyOff: 60,
  /** A clean sheet is told, won or lost late, only where the slot pays at least this for one: a midfielder's 1 is not. */
  cleanSheetStory: 4,
  /** A keeper's score that is a haul, clean sheet and saves together. */
  keeperHaul: 8,
  /** A reserve's score that is a talking point though it counts for nobody. */
  benchScore: 6,
  /** Wins or defeats in a row that make a streak; results unbeaten or without a win, a draw among them, that make a run. */
  streak: 3,
  unbeaten: 4,
  /** Gameweeks without a win before a win is a return to form, and gameweeks of a side's own before its high or low counts. */
  formReturn: 3,
  /** The league's gameweek from which a score or a margin can be a season record. */
  recordsFrom: 4,
  /** Places a side must climb or fall in the table to be news: any move of a match-up's own sides. */
  tableMove: 1,
  /** Meetings, every one won by one side, before a clean sweep is news. */
  sweepFrom: 2,
  /** Earlier periods' rosters read at once, for debuts: a late-season gameweek asks for thirty-odd. */
  rosterBatch: 5,
} as const;

/** The draft desk's news judgement: what each thread of a match-up is worth to its story, the bigger version second
 *  where there is one, and the thresholds that make one. */
export const DRAFT_NEWS = {
  weight: {
    // The match's shape, at the end of the gameweek.
    "bench-turned": [90], "late-decider": [80, 90], "bench-cost": [80], "one-man-show": [70], level: [65], close: [55, 65],
    upset: [60, 75], rout: [50, 60], "match-winner": [40], "same-match": [35],
    // A man's.
    injury: [50], crossfire: [50], haul: [45], "keeper-haul": [45, 60], "clean-lost-late": [45], "bench-six": [40, 55],
    "uncovered-blank": [35, 55], "late-goal": [35, 45], "star-blank": [35], "non-starter": [30, 45], "club-mates": [30, 40],
    "old-boy": [25, 45], "new-arrival": [25, 45], debut: [20, 40], "early-off": [25], double: [20],
    // The season's, each tagged for a Football Manager frame.
    top: [55], record: [50], "streak-ended": [45], "return-to-form": [45], bottom: [45], streak: [40], "season-high": [35],
    "season-low": [35], "stayed-top": [35], climb: [30], fall: [30], "meetings-won": [30],
  },
  /** Added to the one thread that decided a result. */
  decider: 30,
  /** A setback that decided nothing is worth this share of its weight: GW6 led an eight-point win on a loser's 1-point
   *  injury, then on a winner's clean sheet lost at 90+2 (Craig, 14 Oct 2026: "not a narrative"). */
  idleSetback: 0.5,
  /** Below this nothing is a story, and the match-up is told as its result, through its returns. */
  storyFrom: 30,
  /** A man signed this gameweek whose points reach his winning side's margin: the signing that won it. */
  arrivalWon: 60,
  /** A keeper's haul is worth this much more a point past its threshold, up to its bigger weight. */
  keeperHaulPerPoint: 5,
  /** A margin this small is close; this big a rout, and the second a big one. */
  closeWithin: 3,
  routFrom: 15,
  bigRoutFrom: 25,
  /** A man with this many points and this share of his side's total carried it. */
  oneManPoints: 10,
  oneManShare: 0.35,
  /** The winner this many places lower is an upset, from this gameweek of the league's on. */
  upsetPlaces: 4,
  upsetFrom: 4,
  /** A blank by one of the match-up's top few projected men is news, from this Premier League gameweek on; the projection never prints. */
  starBlankTop: 3,
  starBlankFrom: 6,
  /** The angle: a twist and a supporting thread must score this much, a supporting thread for the other side this much;
   *  at most this many supporting threads and this many men in the cast. */
  twistFrom: 50,
  supportingFrom: 35,
  otherSideFrom: 30,
  supporting: 3,
  cast: 4,
  /** A thread of the family this side's story had last time is worth this share of itself, one about a man in last
   *  time's cast this share; two match-ups on a page share a story's family only when the next-best is this far behind. */
  repeatFamily: 0.6,
  repeatMan: 0.7,
  varietyWithin: 15,
} as const;

/** How long a draft report's paragraphs run after each match-up's verdict. */
export const DRAFT_WRITING = {
  /** Words a match-up runs to, lede included; the lead match-up may run to `leadWords`. */
  matchupWords: [50, 120],
  leadWords: 170,
  /** Headline candidates the writer offers with its report, and the pun writer after it. */
  headlines: 6,
  puns: 10,
  /** Filed draft reports read back, so a story, a phrase or a headline is not told the same way twice. */
  pastReports: 4,
  /** A list, not a report (listChecks.ts). A sentence naming this many men with two figures, or carrying this many
   *  figures, is a roll-call, and so is a paragraph of this many sentences each opening on a man. */
  rollCallMen: 3,
  rollCallFigures: 3,
  rollCallParagraph: 3,
  /** Two sentences in a row whose first this-many words take the same shape. */
  openerWords: 4,
  /** The most men a match-up names, the lead and the rest. */
  leadMen: 7,
  men: 5,
  /** A run of this many words from THE STORY in the lede is the brief copied; this many from a side's last report is
   *  an echo. */
  copied: 6,
  echo: 4,
  /** The fact checker's fixes made in one match-up at most: past that, the writing is the problem, not a sentence. Its
   *  token budget, thinking included. */
  factFixes: 4,
  factTokens: 24000,
} as const;
