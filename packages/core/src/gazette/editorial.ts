// The paper's tuning: when each column files, how long it runs, and what is news enough to go in it.

/** The paper's name, printed after the league's on its masthead. */
export const PAPER_TITLE = "Gazetta";

/** The paper's model calls: the writer's model, the helpers' that read rather than write, and the illustrator's, each
 *  overridden from the environment; the API version spoken; a call's budget, which Opus 5.5's thinking spends first; and
 *  the writer's effort, its default, set so a change of default never moves the bill unseen. */
export const NEWSROOM = {
  writer: "claude-opus-5-5",
  /** The draft report's writer, at high effort, and a budget its thinking cannot run out of, as Sonnet 5's did at 16,000
   *  on 7 Oct. Back on Opus once the paper ran on the Max subscription and price stopped deciding (Craig, 14 Oct 2026). */
  draftWriter: "claude-opus-5-5",
  draftEffort: "high",
  draftTokens: 32_000,
  helper: "claude-sonnet-5",
  illustrator: "gpt-image-1",
  apiVersion: "2023-06-01",
  maxTokens: 16_000,
  effort: "medium",
  /** Said so the CLI's own default cannot move it: medium, as high ran a pun writer past the call's deadline (GW6 proof). */
  helperEffort: "medium",
} as const;

/** The most storyline beats a column may report; the newsroom keeps no more than this. */
export const MOST_THREADS = 3;

/** The predicted elevens, London time (Craig, 9 Oct 2026): a Friday lock's from 17:30 that day; any other lock's from
 *  18:00 the evening before, after Friday's conferences. */
export const PREDICTED_XI = { lockDay: { hour: 17, minute: 30 }, eveBefore: { hour: 18 } } as const;

/** The Team Sheet: a column per press-conference day until the lock, from 16:30 London that day once the Mac's import
 *  has merged (Thursday 16:00, Friday 15:45), and Thursday's from 18:00 (Craig, 8 Oct 2026). */
export const TEAM_SHEET = {
  from: { hour: 16, minute: 30 },
  thursday: { weekday: "Thu", hour: 18 },
  /** No round is longer than this many days, so an older conference is about a round already played. */
  windowDays: 7,
  /** FPL's availability note this many days before a conference is the same story; older, a standing absence. */
  freshDays: 2,
} as const;

/** Lawro's predictions: when the column files and how a tie is called. Set before any league was drafted, so
 *  retune after gameweek 9 by counting the gut calls in the archive. */
export const PREDICTIONS = {
  /** Thursday from 20:00 London; a lock earlier in the week files the evening before (Sunday = 0). */
  filing: { weekday: 4, hour: 20, maxLeadDays: 4 },
  /** A tie is close when the gap is at most this share of the favourite's total: 3 points on 40. */
  closeShare: 0.08,
  /** FPL publishes 0/25/50/75/100; at or below this the favourite's best man is a doubt. */
  doubtChance: 50,
  /** Ranks of defensive ease by which the underdog's back line must have the kinder round. */
  defenceEdge: 3,
  /** How many more Liverpool men the underdog must hold, and whose they are (FPL's club code). */
  liverpoolLead: 1,
  liverpoolCode: 14,
  /** The widest gap, as a share of the favourite's total, that a Liverpool gut call may overturn. */
  liverpoolShare: 0.15,
  /** The brief's caps: key men a side, how deep it looks for doubts, what counts as a hard fixture. */
  keyMen: 3,
  doubtDepth: 6,
  hardFixtures: 5,
  /** How many of his last columns make a man old news, unless something is new for him. */
  wornColumns: 2,
  /** A fixture among the kindest this many is an easy one; the last games a man's form is read from. */
  kindFixtures: 5,
  recentGames: 2,
  /** The most facts one tie's brief carries. */
  factsPerTie: 11,
  /** His last columns the skit writer may not repeat: the endings of this many, and the pun targets of this many. */
  wornEndings: 12,
  wornTargets: 10,
  /** His call's budget, thinking included: five three-paragraph ties under every rule spent 16,000 thinking on 8 Oct 2026. */
  tokens: 32_000,
  /** Clubs at each end of the strength ratings worth a word: "a dangerous attack", "a soft defence". */
  extremes: 3,
  /** Minutes in each of his last games that make a man with no goal and no assist gone quiet, and the goals and
   *  assists together that make his form a line. */
  quietMinutes: 60,
  involvements: 2,
  /** Men a gut fact names for a side: its Liverpool men, or its kindest-drawn back men. */
  gutMen: 2,
  /** His past lines: columns an instinct's line rests after use, and a rotation line; a rotation line every this
   *  many columns. */
  pastRest: { instinct: 4, rotation: 12 },
  rotationEvery: 4,
} as const;

/** What the editor holds Lawro to in both his columns, and what his voice tells him. */
export const LAWRO_LIMITS = {
  /** Words a sentence; sentences and words for his opening, a tie and a gut call; words a column. */
  sentence: 20,
  intro: [1, 4, 40],
  tie: [3, 8, 120],
  gut: [3, 9, 130],
  /** A tie the desk could not call: no sides and no call, so sentences and words at most. */
  noCall: [2, 3, 120],
  column: 680,
  /** A run of this many words from a recent column is a repeat, and of this many from another tie an echo. */
  repeat: 5,
  echo: 4,
  /** Men a tie names, and question marks a column carries, at most. */
  men: 4,
  questions: 2,
  /** Ties that may share an opening or an ending frame, or carry the dull-game moan. */
  sameFrame: 1,
  dullMoan: 1,
  /** A called tie's paragraphs, one side, the other and the call (Craig, 8 Oct 2026), and the call's words at least. */
  paragraphs: 3,
  callWords: 5,
  /** Times one tie may name a side; past that, the reader knows whose men they are. */
  sideNamed: 3,
  /** Characters of a section a fault quotes when no one sentence of it broke the rule. */
  quote: 60,
  /** The skit writer's rewrite: words at most, words longer than the sentence it replaces, and a kicker's words; edits
   *  a column, and a run of words from one of his recent last lines that makes a line he has used. */
  skit: { words: 20, longer: 6, kicker: 3, edits: 2, used: 4 },
  /** His last columns a phrase may not repeat from, and the words a sentence on average past which the editor warns. */
  recentColumns: 6,
  averageWords: 12,
} as const;

/** Lawro's power rankings: the squads as drafted, ordered by the season played out, once, before the first lock. */
export const SEASON_RANKINGS = {
  /** Playings of the season, and the seed that makes them the same every time. */
  runs: 10_000,
  seed: 2026,
  /** The sister model's band is a 5th-to-95th percentile: its half-width is this many deviations. */
  band: 1.645,
  /** The correlation between any two men of one eleven in one period: a clean sheet lifts a back line, a rout a
   *  front line. */
  together: 0.5,
  /** A squad is clear at the top when the next is at least this many places behind it on average. */
  clear: 1,
  /** Each side's line: sentences at least and at most, and words at most; the opening's sentences, at least and at most. */
  line: [1, 2, 30],
  opening: [2, 3],
} as const;

/** Hours from a kickoff until its figures stop moving, an hour past full time, when Fantrax's auto-subs run. The Prem
 *  Report's day and the draft report's gameweek file then, never on FPL's bonus (unconfirmed at noon on 11 Oct 2026). */
export const SETTLED_AFTER_KICKOFF_HOURS = 3;

/** The match-day report's editorial thresholds. */
export const REPORTS = {
  /** A report call's budget, thinking included: 10 Oct 2026's six matches stopped on max_tokens at the default 16,000. */
  tokens: 48_000,
  budget: {
    lead: { sections: 3, stats: 9 },
    ordinary: { sections: 2, stats: 8 },
    dead: { sections: 1, stats: 6 },
  },
  /** The account's most words, from the match: a base, each goal, each red card, goal ruled out or penalty not scored, and
   *  a cap. No floor: a match with little in it is a short report. */
  account: { base: 30, goal: 25, decision: 15, most: 150 },
  /** An account paragraph's sentences, fewest and most. */
  paragraph: [2, 4],
  /** Words a standfirst and a section's football may run to, and a sentence before the editor warns. */
  standfirstWords: 25,
  sectionWords: [20, 45],
  sentenceWords: 35,
  /** A burst is two goals by one side this close. */
  burstMinutes: 15,
  /** A key-stats line earns its place past these, and the points line names this many men. xA only chooses; it never prints. */
  stats: { mostShots: 4, chances: 3, expectedAssists: 0.4, pointsMen: 4 },
  /** Chances not taken the account tells, at most; the match xG from which a man who did not score had a good one; and the
   *  match xG from which his chances were good enough to score. */
  missed: { most: 1, quality: 0.3, goodEnough: 0.5 },
  /** A section man's weight: his league points, each goal and assist, and what makes his day league news: points on a bench,
   *  a free agent's day, a claim or a drop this gameweek, a close head-to-head, a man lost to an injury or a red card; and
   *  what a section on both sides of one head-to-head adds to its two men's mean. */
  weight: { involvement: 3, bench: 6, freeAgent: 5, moved: 4, closeTie: 3, lost: 6, joint: 3 },
  /** Points from which a reserve's or a free agent's day is news, and the margin within which a head-to-head is close. */
  newsPoints: 6,
  closeTie: 6,
  /** A run of this many words shared with another match, or a recent report, is an echo. */
  echo: 4,
  /** The fan's quotes kept for any one part of a piece. */
  fanFlags: 3,
  /** Earlier report days whose phrasing a new one may not echo. */
  pastDays: 4,
  /** Matches written in one call; a longer day is split, the later call shown what is already on the page. Five ran
   *  past the five-minute model timeout on 10 Oct 2026. */
  perCall: 2,
} as const;

/** A goal from this minute is late: a late winner, a scorer's late goal, the one that took a clean sheet. */
export const LATE_GOAL_MINUTE = 80;

/** Days after a match in which Fantrax's first story on a man who went off or missed it is about that match. */
export const FITNESS_DAYS = 5;

/** The draft report's judge: the quotes kept for any one match-up. */
export const DRAFT_JUDGE_QUOTES = 3;

/** A match report's key stats and the Bin XI's: how many men a top-xG or top-xA line names, and the least that earns
 *  a place in it. */
export const KEY_STATS = { topMen: 3, expectedGoals: 0.3, expectedAssists: 0.3 } as const;

/** The Bin XI: the best eleven nobody has, filed on Tuesday before Wednesday's waivers. */
export const BIN_XI = {
  /** The London weekday it files on: the one day with no league event. */
  weekday: "Tue",
  /** How far the chances a man made or missed move his points when picking: a 9 still beats a 5. */
  luck: 0.5,
  /** The column's length, in words, and its paragraphs; the check's most is past the `asked` most, so a near-miss is not sent back. */
  words: [120, 170],
  asked: 150,
  paragraphs: 2,
} as const;

/** Here We Go: a completed trade as a transfer insider's item, filed on detection, any day (Craig, 9 Oct 2026). */
export const HERE_WE_GO = {
  /** Trades one firing may assign, newest first, so a first run files the latest two and not the season's. */
  perFiring: 2,
  /** The item's sentences and most words, the desk's sign-off not counted. */
  sentences: [2, 4],
  words: 70,
} as const;
