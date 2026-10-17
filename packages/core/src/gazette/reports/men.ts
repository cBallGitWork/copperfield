import { THE_HOUR } from "../../config";
import type { PlMoment } from "../../football/premierleague/moments";
import type { PlSquadMan, PlTeamSheet } from "../../football/premierleague/teamSheet";
import type { ReportMan, ReportMatchInput } from "./types";
import type { Side } from "../side";
import { clock } from "./minutes";
import { isDismissal } from "./timeline";
import { surname } from "../../names";

// Every man in the match sheet as the desk reads him: started or came on, when he left and why, and what the script joined.

/** FPL's per-man figures for this match, by code. */
interface LiveLine {
  minutes: number;
  saves: number;
  expectedGoals: number;
  expectedAssists: number;
}

/** His season before this match (goals including it), by code, as of the match day. */
export interface SeasonLine {
  startsBefore: number;
  matchesBefore: number;
  goalsSeason: number;
}

export interface MenExtras {
  live: ReadonlyMap<number, LiveLine>;
  /** Null when a past gameweek could not be read: no man's season is then told. */
  season: ReadonlyMap<number, SeasonLine> | null;
  holders: ReadonlyMap<number, NonNullable<ReportMan["holder"]>>;
  dropped: ReadonlyMap<number, NonNullable<ReportMan["dropped"]>>;
  points: ReadonlyMap<number, number>;
  defensive: ReadonlyMap<number, number>;
  /** The most defensive points a match pays at the slot each was priced at, from the league's scoring. */
  defensiveMost: ReadonlyMap<number, number>;
  fitness: ReadonlyMap<number, string>;
  /** Each man's name parts as his club gave them, by code. */
  nameParts: ReadonlyMap<number, { first?: string; last?: string }>;
}

const NO_SEASON: SeasonLine = { startsBefore: 0, matchesBefore: 0, goalsSeason: 0 };
const UNREAD: Pick<ReportMan, keyof SeasonLine> = { startsBefore: null, matchesBefore: 0, goalsSeason: null };

/** Both sheets, starters then substitutes; a man the bridge could not place has no code and is left out. */
export function reportMen(
  sheets: { home: PlTeamSheet; away: PlTeamSheet },
  moments: readonly PlMoment[],
  extras: MenExtras,
): ReportMan[] {
  const on = new Map<number, string>();
  const off = new Map<number, { at: string; injured: boolean; sentOff: boolean }>();
  for (const moment of moments) {
    const [first, second] = moment.men;
    if (moment.kind === "substitution") {
      if (first !== null) on.set(first, moment.minute);
      if (second !== null) off.set(second, { at: moment.minute, injured: moment.injury, sentOff: false });
    }
    if (moment.kind === "injured-off" && first !== null) off.set(first, { at: moment.minute, injured: true, sentOff: false });
    if (isDismissal(moment.kind) && first !== null) off.set(first, { at: moment.minute, injured: false, sentOff: true });
  }

  const man = (squad: PlSquadMan, side: Side, started: boolean): ReportMan[] => {
    const code = squad.code;
    if (code === null) return [];
    const live = extras.live.get(code);
    const season = extras.season === null ? UNREAD : (extras.season.get(code) ?? NO_SEASON);
    const left = off.get(code);
    return [
      {
        code,
        name: squad.name,
        surname: surname(squad.name, extras.nameParts.get(code)),
        side,
        started,
        onAt: started ? null : (on.get(code) ?? null),
        offAt: left?.at ?? null,
        injuredOff: left?.injured ?? false,
        sentOff: left?.sentOff ?? false,
        line: squad.position,
        minutes: live?.minutes ?? 0,
        saves: live?.saves ?? 0,
        expectedGoals: live?.expectedGoals ?? 0,
        expectedAssists: live?.expectedAssists ?? 0,
        ...season,
        holder: extras.holders.get(code) ?? null,
        dropped: extras.dropped.get(code) ?? null,
        points: extras.points.get(code) ?? null,
        defensive: extras.defensive.get(code) ?? null,
        defensiveMost: extras.defensiveMost.get(code) ?? null,
        fitness: extras.fitness.get(code) ?? null,
      },
    ];
  };
  const sideOf = (sheet: PlTeamSheet, side: Side) => [
    ...sheet.lineup.flatMap((squad) => man(squad, side, true)),
    ...sheet.substitutes.flatMap((squad) => man(squad, side, false)),
  ];
  return [...sideOf(sheets.home, "home"), ...sideOf(sheets.away, "away")];
}

/** Whether he played at all: started, or came on. */
export const played = (man: ReportMan) => man.started || man.onAt !== null;

/** His first start in the league this season, his club having played before. */
export const firstLeagueStart = (man: ReportMan) => man.started && man.startsBefore === 0 && man.matchesBefore > 0;

/** Taken off before the hour, for no injury and no red card. */
export const offEarly = (man: ReportMan) => !man.injuredOff && !man.sentOff && man.offAt !== null && (clock(man.offAt)?.minute ?? THE_HOUR) < THE_HOUR;

/** A start or a change that is news in itself: a first start, off early, injured or sent off. */
export const changeIsNews = (man: ReportMan) => firstLeagueStart(man) || offEarly(man) || man.injuredOff || man.sentOff;

/** "Bukayo Saka (Arsenal)", as every brief names a man; "someone" for a man nobody could place. */
export const withClub = (match: ReportMatchInput, man: ReportMan | null) => (man === null ? "someone" : `${man.name} (${match[man.side].name})`);

/** The goalkeeper `side` had on the pitch at `at` (minute plus added time); null when the sheet names none. */
export function keeperAt(match: ReportMatchInput, side: Side, at: number): ReportMan | null {
  const when = (label: string | null, none: number) => {
    const c = label === null ? null : clock(label);
    return c === null ? none : c.minute + c.added;
  };
  return match.men.find((m) => m.side === side && m.line === "G" && (m.started || when(m.onAt, Infinity) <= at) && when(m.offAt, Infinity) > at) ?? null;
}
