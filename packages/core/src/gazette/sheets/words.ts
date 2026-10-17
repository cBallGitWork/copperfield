// The house's banned phrasing, first written for the team-news desk; the Bin XI, Here We Go and the backstop read it,
// and every desk reads its American words as part of `british.ts`'s one list.

/** Stock phrases a model reaches for and a reporter does not, sent back wherever they appear. */
export const SHEETS_STOCK: readonly string[] = [
  "to his name", "of late", "the same span", "the same stretch", "the same run", "his recent run", "recent weeks",
  "arrives with", "across his last", "over his last", "in his last", "so far this season", "brings with him",
  "form to match", "rich vein", "purple patch", "in fine form", "in good form", "hot streak", "awaits", "having managed",
  "a worry for", "both a worry", "leads the line with", "not certain to be", "major blow", "injury crisis",
  "selection headache", "race against time", "talisman", "nailed-on", "ever-present", "engine room", "pulls the strings",
  "stalwart", "mainstay", "will be hoping", "look to", "grouped by", "locked", "between the sticks",
  "in the middle of the park", "carrying a knock", "out wide", "full debut",
];

/** American, or no football reporter's word, sent back wherever it appears. "field" is not here: to field a side is
 *  British. */
export const SHEETS_AMERICAN: readonly string[] = [
  "sits", "sit", "sitting", "sat", "roster", "rosters", "lineup", "lineups", "center", "defense", "offense",
  "matchup", "matchups", "game-time", "questionable", "day-to-day", "slated", "tallied", "notched", "tapped",
  "soccer", "shutout", "shutouts", "shut-out", "shut-outs", "benchwarmer", "go-to", "starter", "starters", "vs", "gotten", "preseason",
  "offseason", "locker room", "cleats", "uniform", "overtime", "gameday", "road game", "road trip", "season opener",
  "banged up", "tweaked", "probable", "depth chart", "rookie", "on the field", "sideline", "sidelines",
  "center-forward", "centerback", "leveled", "labeled", "fueled", "totaled", "practiced",
  // Spelling: UK British, as The Times prints it.
  "favorite", "favorites", "color", "colors", "honor", "labor", "neighbor", "rumor", "rumors", "program", "practicing",
  "traveled", "traveling", "canceled", "fulfill", "skillful", "gray", "toward", "afterward", "meters", "kilometers",
];

/** An American -ize, where The Times prints -ise; "size", "prize", "seize" and "capsize" in any form, and a size compound
 *  ("oversized"), are not verbs of the kind. */
export const AMERICAN_IZE = /\b(?!(?:(?:over|under|down|super|up|mid|full|king|life|bite)?-?size[ds]?|sizing|prize[ds]?|prizing|seize[ds]?|seizing|capsize[ds]?|capsizing|maize|baize)\b)\p{L}{2,}(?:ize|izes|ized|izing|ization)\b/iu;

/** Where a fact came from stays off the page: a reporter does not cite his workings. */
export const SOURCE = /%|\bper ?cent\b|\b(?:projected|projections?|predicted|predictions?|model|FPL|Fantrax|according to|The Athletic)\b|\bper (?!cent)\p{L}/iu;
/** Unchanged is the whole of it: never how many gameweeks, nor a season's count. */
export const COUNTED = /\b(?:(?:second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|\d+(?:st|nd|rd|th)) (?:week|round|game|gameweek)|(?:weeks?|rounds?) running|in a row|on the (?:trot|spin)|all (?:two|three|four|five|six|seven|eight|nine|ten|\d+) (?:\p{L}+ )?(?:matches|games|starts|appearances)|this season)\b/iu;
