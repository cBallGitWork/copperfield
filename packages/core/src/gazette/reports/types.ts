import type { PlMoment } from "../../football/premierleague/moments";
import type { StoryLineup } from "./lineups";
import type { Club, Fixture } from "../../football/types";
import type { Side } from "../side";

// What the match-day desk is handed: plain data, joined by the script, read by the pure builders beside this file.

export interface ReportClub {
  code: number;
  /** The name the paper prints, e.g. "Tottenham Hotspur". */
  name: string;
  /** The short forms the writer may also use, e.g. "Tottenham", "Spurs"; the first tags the key stats. Empty when the name is short. */
  shorts: string[];
  /** The nickname a paper may use once the club is named, e.g. "the Lilywhites"; null when it has none. */
  nickname: string | null;
  /** Named only when the club's staff list has exactly one manager. */
  manager: string | null;
}

/** One head-to-head this period, from the holder's side; a score is null when the live read refused. */
export interface HeadToHeadStake {
  opponent: string;
  us: number | null;
  them: number | null;
  over: boolean;
}

/** One man in the match, with his club always. */
export interface ReportMan {
  code: number;
  name: string;
  /** What the paper calls him after his full name, as the club names him: "van Hecke", "Strand Larsen", "João Pedro". */
  surname: string;
  side: Side;
  started: boolean;
  /** The clock labels he came on and went off, as printed. */
  onAt: string | null;
  offAt: string | null;
  injuredOff: boolean;
  sentOff: boolean;
  /** The line he was named in: G, D, M or F. */
  line: string | null;
  minutes: number;
  saves: number;
  /** Used to choose who earns a line; never printed. */
  expectedGoals: number;
  expectedAssists: number;
  /** Before this match, this season; null when a past gameweek could not be read. */
  startsBefore: number | null;
  matchesBefore: number;
  /** This season including this match; null when a past gameweek could not be read. */
  goalsSeason: number | null;
  /** The league side that has him, whether he was in its eleven, where its head-to-heads stand this period (none for a
   *  bye, two for a double header), and the London weekday it claimed him when that was this gameweek. */
  holder: { team: string; fielded: boolean; round: number | null; h2h: readonly HeadToHeadStake[]; since: string | null } | null;
  /** The side that let him go this gameweek and the weekday, for a free agent; null otherwise. */
  dropped: { team: string; day: string } | null;
  /** His league points for this match, at his slot in a manager's eleven and at his own position otherwise; null when
   *  unread or the period holds two of his matches. */
  points: number | null;
  /** The league's defensive points within them, priced the same way; null when unread. */
  defensive: number | null;
  /** The most defensive points one match pays him, read from the league's scoring; null when unread or unbounded. */
  defensiveMost: number | null;
  /** The club's own word on his fitness, published after the match. */
  fitness: string | null;
}

export interface SideFigures {
  shots: number;
  onTarget: number;
}

export interface ReportMatchInput {
  fixture: Fixture;
  home: ReportClub;
  away: ReportClub;
  halfTime: { home: number; away: number } | null;
  referee: string | null;
  moments: readonly PlMoment[];
  men: readonly ReportMan[];
  figures: { home: SideFigures; away: SideFigures } | null;
  videoId: string | null;
  /** Read from the match record, never recalled. */
  venue: string | null;
  attendance: number | null;
  lineups: { home: StoryLineup; away: StoryLineup } | null;
  /** Our mark out of ten for each man who played, by code; null where he was too brief to rate. Empty when unread. */
  marks: ReadonlyMap<number, number | null>;
}

export interface ReportDayInput {
  /** London calendar day, `2026-09-19`. */
  day: string;
  gameweek: number;
  matches: readonly ReportMatchInput[];
  /** Every fixture of the season, for the table and what comes next. */
  season: readonly Fixture[];
  clubs: readonly Club[];
  /** The fewest saves the league pays a keeper for, read from its scoring; null when unread. */
  keeperRung: number | null;
}
