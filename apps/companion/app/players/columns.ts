import {
  ASSISTS_FANTASY,
  ASSISTS_OFFICIAL,
  ASSISTS_TOTAL,
  CLEAN_SHEETS,
  DEFCON,
  GOALS,
  GOALS_AGAINST,
  GOALS_AGAINST_OUTFIELD,
  KEEPER_POINTS,
  MINUTES,
  OWN_GOALS,
  PENALTIES_MISSED,
  PENALTY_SAVES,
  RED_CARDS,
  SAVES,
  YELLOW_CARDS,
  wordsFor,
  type FantraxCategory,
  type FigureKind,
} from "@epl/core";
import type { PoolRow } from "./pool";
import type { PoolGroup } from "./groups";
import { ATTRIBUTE_COLUMNS } from "./attributeColumns";
import { SEASON_COLUMNS } from "./seasonColumns";

// Every column the Data boards draw, phone-first, each on Players or Adv Stats (`views.ts`). The fantasy figures come off `PoolRow`, the counts off the stats
// bag; a count a man's half does not carry (an outfielder's Sv) is a dash, never 0.

/** One man's counts: the grouped read's by Fantrax's abbreviation, ours and the stats league's under their own keys. */
export type RawStats = Record<string, number | null> | undefined;

/** Which end of a column is lit. `low` marks offenders only: nothing lights for a man on nought yellow cards. */
type Mark = "high" | "low";

export interface PoolColumn {
  /** Short, because it ends up in the address bar. */
  key: string;
  label: string;
  title: string;
  /** The key's one line on what it counts, where its title alone does not say. */
  means?: string;
  /** Which plate it appears under; absent is the spine, drawn under all of them. */
  group?: PoolGroup;
  /** Which end of it is lit, if either. */
  mark?: Mark;
  /** A count, which the per-90 toggle divides by minutes. A rate or a denominator never is. */
  rate?: true;
  /** The bag key of the minutes a rate divides by, where not the served league's `Min`. */
  minutes?: string;
  /** Which way it runs when first tapped. */
  ascending: boolean;
  value: (row: PoolRow, stats: RawStats) => number | string | null;
  /** The Fantrax column a count reads, so a board drops it where the league scores no such category. */
  stat?: string;
  /** The kind of figure, where it prints at fixed places rather than as it arrives. */
  places?: FigureKind;
  /** Ours rather than recorded, in the derived reading's ink and never marked. */
  derived?: true;
  /** The league category it counts: Players draws it only where getLeagueInfo says the league scores it. */
  scores?: FantraxCategory;
  /** A second category the same column reads, under the other half's name: an outfielder's GAO beside a keeper's GA. */
  also?: FantraxCategory;
  /** On Players whatever the league scores: its points, and the games and DefCon they are read against. */
  fantasy?: true;
}

/** Our DefCon points in the stats bag, beside Fantrax's counts. */
export const DEFCON_POINTS = "DCP";

/** A raw count read out of the grouped payload by its Fantrax abbreviation, rated under the toggle. */
function byAbbreviation(key: string, title: string, group: PoolGroup, mark: Mark = "high"): PoolColumn {
  return {
    key: key.toLowerCase().replace(/[^a-z0-9]/g, ""),
    label: key,
    title,
    group,
    mark,
    rate: true,
    ascending: false,
    value: (_row, stats) => stats?.[key] ?? null,
    stat: key,
  };
}

/** A scoring category's count, read by Fantrax's code, headed and keyed in our words. */
function count(category: FantraxCategory, group: PoolGroup, mark: Mark = "high"): PoolColumn {
  const words = wordsFor(category);
  return { ...byAbbreviation(category.short, words.key, group, mark), label: words.head, scores: category };
}

/** Minutes and games, never rated: ninety minutes' worth of minutes is ninety on every row. */
function denominator(column: PoolColumn): PoolColumn {
  return { ...column, rate: undefined };
}

/** Position, club and status sit beside the name (Craig, 10 Sep 2026), filtered in the drawer rather than sorted. */
export const COLUMNS: PoolColumn[] = [
  {
    key: "name",
    label: "Player",
    title: "Name",
    ascending: true,
    value: (row) => row.entry.player.displayName,
  },
  {
    key: "fpts",
    label: "FPts",
    title: "Fantasy points, under this league's scoring",
    group: "scoring",
    mark: "high",
    rate: true,
    ascending: false,
    fantasy: true,
    value: (row) => row.stats?.points ?? null,
  },
  {
    key: "fpg",
    label: "FP/G",
    title: "Fantasy points per game",
    places: "perGame",
    group: "scoring",
    mark: "high",
    ascending: false,
    fantasy: true,
    // No game is no reading: Fantrax prints 0.00 for it.
    value: (row, stats) => (stats?.GP === 0 ? null : (row.stats?.perGame ?? null)),
  },
  denominator(count(MINUTES, "scoring")),
  { ...denominator(byAbbreviation("GP", "Games played", "scoring")), fantasy: true },
  count(GOALS, "attacking"),
  count(ASSISTS_TOTAL, "creating"),
  count(ASSISTS_OFFICIAL, "creating"),
  count(ASSISTS_FANTASY, "creating"),
  ...SEASON_COLUMNS,
  count(CLEAN_SHEETS, "defensive"),
  ...DEFCON.map((category) => count(category, "defensive")),
  {
    key: "dcp",
    label: "DCP",
    title: "DefCon points, worked out per match, at his slot or a free agent's best position",
    group: "defensive",
    derived: true,
    rate: true,
    ascending: false,
    fantasy: true,
    value: (_row, stats) => stats?.[DEFCON_POINTS] ?? null,
    stat: DEFCON_POINTS,
  },
  // A keeper's read calls it GA and an outfielder's GAO: one fact, one column, as on the team's Stats tab.
  {
    ...count(GOALS_AGAINST, "defensive", "low"),
    title: wordsFor(GOALS_AGAINST).name,
    also: GOALS_AGAINST_OUTFIELD,
    value: (_row, stats) => stats?.[GOALS_AGAINST.short] ?? stats?.[GOALS_AGAINST_OUTFIELD.short] ?? null,
  },
  count(SAVES, "defensive"),
  count(KEEPER_POINTS, "defensive"),
  count(PENALTY_SAVES, "defensive"),
  count(YELLOW_CARDS, "discipline", "low"),
  count(RED_CARDS, "discipline", "low"),
  count(PENALTIES_MISSED, "attacking", "low"),
  count(OWN_GOALS, "defensive", "low"),
  ...ATTRIBUTE_COLUMNS,
];

/** Fantrax's own default, FPts highest first; named so reordering `COLUMNS` cannot change it. */
export const DEFAULT_SORT = "fpts";

/** The Per 90 toggle over the columns drawn: null hides it where none divides by minutes, as on the Attributes plate. */
export function ratedOn(columns: readonly PoolColumn[], per90: boolean): boolean | null {
  return columns.some((column) => column.rate === true) ? per90 : null;
}

/** The heads as drawn: each rated one marked /90 under Per 90, since 0.82 could also be a season's total. */
export function headedFor(columns: readonly PoolColumn[], rated: boolean | null): PoolColumn[] {
  return columns.map((column) => (rated === true && column.rate === true ? { ...column, label: `${column.label}/90` } : column));
}

export function columnFor(key: string | undefined): PoolColumn | undefined {
  return COLUMNS.find((column) => column.key === key);
}
