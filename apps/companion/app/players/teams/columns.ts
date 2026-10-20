import { ON_THE_PITCH, type FigureKind, type PlClubSeason, type SeasonTotals } from "@epl/core";
import { byFigure } from "../../components/league/order";
import { TEAMS } from "../routes";
import type { TeamRow } from "./teamRows";

// The board's measures as data, so the heads, the cells, the sort, the standouts and the plates cannot disagree.

/** The groups, in the board's order: a plate each under a thumb, a head over its run on the desk; Attack rests. */
export const TEAM_GROUPS = [
  { key: "attack", label: "Attack" },
  { key: "chances", label: "Chances" },
  { key: "defence", label: "Defence" },
  { key: "discipline", label: "Discipline" },
] as const;

export type TeamGroup = (typeof TEAM_GROUPS)[number];

export interface TeamColumn {
  key: string;
  group: TeamGroup["key"];
  head: string;
  title: string;
  of: (row: TeamRow) => number | null;
  /** The kind of figure, which sets its places; a count when absent. */
  kind?: FigureKind;
  /** Which end is good: its standouts are lit, red where more is worse; that end also sorts first. */
  rank: "high" | "low";
}

/** One of Opta's figures, a dash where the Premier League has no season for the club. */
const opta = (key: Exclude<keyof PlClubSeason, "clubCode">) => (row: TeamRow) => row.season?.[key] ?? null;

/** One of the squad's FPL figures, a dash where FPL files nobody at the club. */
const squad = (key: keyof SeasonTotals, share = 1) => (row: TeamRow) => (row.squad ? row.squad[key] / share : null);

export const TEAM_COLUMNS: readonly TeamColumn[] = [
  { key: "g", group: "attack", head: "G", title: "Goals", of: opta("goals"), rank: "high" },
  { key: "sh", group: "attack", head: "Sh", title: "Shots", of: opta("shots"), rank: "high" },
  { key: "sot", group: "attack", head: "SoT", title: "Shots on target", of: opta("shotsOnTarget"), rank: "high" },
  { key: "bc", group: "attack", head: "BC", title: "Big chances, scored or missed", of: opta("bigChances"), rank: "high" },
  { key: "xg", group: "attack", head: "xG", title: "Expected goals, the squad's", of: squad("expectedGoals"), kind: "expected", rank: "high" },
  { key: "a", group: "chances", head: "A", title: "Assists", of: opta("assists"), rank: "high" },
  { key: "kp", group: "chances", head: "KP", title: "Chances created: passes that led to a shot", of: opta("chancesCreated"), rank: "high" },
  { key: "bcc", group: "chances", head: "BCC", title: "Big chances created", of: opta("bigChancesCreated"), rank: "high" },
  { key: "xa", group: "chances", head: "xA", title: "Expected assists, the squad's", of: squad("expectedAssists"), kind: "expected", rank: "high" },
  { key: "gc", group: "defence", head: "GC", title: "Goals conceded", of: opta("goalsConceded"), rank: "low" },
  // FPL counts each chance against once per man on the pitch, so eleven share one.
  { key: "xgc", group: "defence", head: "xGC", title: "Expected goals conceded", of: squad("expectedGoalsConceded", ON_THE_PITCH), kind: "expected", rank: "low" },
  { key: "cs", group: "defence", head: "CS", title: "Clean sheets", of: opta("cleanSheets"), rank: "high" },
  { key: "sha", group: "defence", head: "ShA", title: "Shots conceded", of: opta("shotsConceded"), rank: "low" },
  { key: "tk", group: "defence", head: "Tk", title: "Tackles", of: opta("tackles"), rank: "high" },
  { key: "int", group: "defence", head: "Int", title: "Interceptions", of: opta("interceptions"), rank: "high" },
  { key: "rec", group: "defence", head: "Rec", title: "Ball recoveries", of: opta("recoveries"), rank: "high" },
  { key: "blk", group: "defence", head: "Blk", title: "Shots blocked", of: opta("blocks"), rank: "high" },
  { key: "ers", group: "discipline", head: "ErS", title: "Errors leading to a shot", of: opta("errorsLeadingToShot"), rank: "low" },
  { key: "erg", group: "discipline", head: "ErG", title: "Errors leading to a goal", of: opta("errorsLeadingToGoal"), rank: "low" },
  { key: "fls", group: "discipline", head: "Fls", title: "Fouls committed", of: opta("fouls"), rank: "low" },
  { key: "yc", group: "discipline", head: "YC", title: "Yellow cards", of: opta("yellowCards"), rank: "low" },
  { key: "rc", group: "discipline", head: "RC", title: "Red cards", of: opta("redCards"), rank: "low" },
];

/** What the address asks for: a sort names its column's plate, so the order is never hidden; otherwise the plate asked
 *  (Attack when unknown) ordered by its lead column. A direction not asked starts at the column's good end. */
export function teamsView(asked: { group?: string; sort?: string; dir?: string }): {
  group: TeamGroup;
  sort: TeamColumn;
  descending: boolean;
  columns: readonly TeamColumn[];
} {
  const named = TEAM_COLUMNS.find((column) => column.key === asked.sort);
  const group = TEAM_GROUPS.find((entry) => entry.key === (named?.group ?? asked.group)) ?? TEAM_GROUPS[0];
  const columns = TEAM_COLUMNS.filter((column) => column.group === group.key);
  const sort = named ?? columns[0];
  return { group, sort, descending: (asked.dir ?? (sort.rank === "high" ? "desc" : "asc")) === "desc", columns };
}

/** A plate's address: the resting one bare, so the canonical board has one URL. */
export function plateHref(group: TeamGroup): string {
  return group.key === TEAM_GROUPS[0].key ? TEAMS : `${TEAMS}?group=${group.key}`;
}

/** A head's link: a column not sorted starts at its good end, the sorted one reverses; a plate's lead at its good end
 *  is the plate's own address. */
export function sortHref(column: TeamColumn, sort: TeamColumn, descending: boolean): string {
  const next = column.key === sort.key ? !descending : column.rank === "high";
  const group = TEAM_GROUPS.find((entry) => entry.key === column.group) ?? TEAM_GROUPS[0];
  const lead = TEAM_COLUMNS.find((entry) => entry.group === column.group);
  if (column === lead && next === (column.rank === "high")) return plateHref(group);
  return `${TEAMS}?sort=${column.key}&dir=${next ? "desc" : "asc"}`;
}

/** Ordered by one column; an absent figure sinks either way, and a tie falls to the name. */
export function sortedTeams(rows: readonly TeamRow[], column: TeamColumn, descending: boolean): TeamRow[] {
  return [...rows].sort(
    (a, b) => byFigure(column.of(a), column.of(b), descending) || a.club.shortName.localeCompare(b.club.shortName),
  );
}
