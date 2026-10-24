import { positionsLabel } from "../positions";
import type { Club, FootballPlayer, FootballSnapshot, LeagueScoring, PlayerMatchStats, PoolPlayer } from "@epl/core";
import { clubById, defConAt, playerByCode, playerById } from "@epl/core";
import { LISTS, asPrinted, ranked, type LeaderList, type Ranked } from "./lists";
import type { Held } from "../players/holder";
import type { PeriodLine } from "../statsLeague";

// This gameweek's leaders: Fantrax's points for every man it priced, free agents too, the stats league's DefCon
// counts for each group of positions the league counts alike, and FPL's per-match measures. Pure; the page reads.

/** One man as a list draws him: his place, his club, his page and who holds him. */
export interface TopRow extends Ranked {
  club: Club | undefined;
  href: string | null;
  /** Who holds him; null for a man nobody holds, as Live prints an owner only where there is one. */
  held: Held | null;
  /** The footballer behind the code, for his name in full and his fitness. */
  footballer: FootballPlayer | undefined;
}

/** One list: its key in the address, the word on its tab, the list it is drawn as, and its men. */
export interface TopBoard {
  key: string;
  tab: string;
  list: LeaderList;
  rows: TopRow[];
}

/** Our league's word for a position in a list's title; a letter not here prints as itself. */
const POSITION_WORD: Record<string, string> = { G: "keepers", D: "defenders", M: "midfielders", F: "forwards" };

/** The list for a measure. */
function listOf(key: string): LeaderList {
  const list = LISTS.find((each) => each.key === key);
  if (list === undefined) throw new Error(`no Top stats list "${key}"`);
  return list;
}

const POINTS = listOf("points");
const XG = listOf("xg");
const XA = listOf("xa");

/** Positions the league counts DefCon alike at, drawn as one list: the category counted and its positions in pitch order. */
export interface DefconGroup {
  category: string;
  positions: readonly string[];
}

/** A DefCon column's head: "DC" and the letters of the positions it is paid at ("DC MF"). */
export function defConHead(positions: readonly string[]): string {
  return `DC ${positions.join("")}`;
}

/** A group's DefCon list and its tab, named with the slots it counts ("DefCon M/F"): the count itself, never points. */
export function defconList(group: DefconGroup): { tab: string; list: LeaderList } {
  const { positions } = group;
  const tab = `DefCon ${positionsLabel(positions) ?? positions.join("/")}`;
  return {
    tab,
    list: {
      key: `defcon-${positions.join("")}`,
      title: `DefCon, ${positions.map((position) => POSITION_WORD[position] ?? position).join(" and ")}`,
      head: defConHead(positions),
      explain: "DefCon this gameweek, counted as the league counts it at these positions",
      kind: "count",
    },
  };
}

/** The positions the league counts DefCon at, one group per category it counts, each in the order given. */
export function defconGroups(scoring: LeagueScoring, positions: readonly string[]): DefconGroup[] {
  const groups = new Map<string, string[]>();
  for (const position of positions) {
    const at = defConAt(scoring, position);
    if (at !== null) groups.set(at.short, [...(groups.get(at.short) ?? []), position]);
  }
  return [...groups].map(([category, grouped]) => ({ category, positions: grouped }));
}

/** Each seated man's count in one category over the period, by Fantrax id; a man the period has no line for is off. */
export function defconCounts(lines: readonly PeriodLine[], seated: readonly string[], category: string): Record<string, number | null> {
  const seats = new Set(seated);
  return Object.fromEntries(lines.flatMap(([fantraxId, , counts]) => (seats.has(fantraxId) ? [[fantraxId, counts[category] ?? null]] : [])));
}

/** Who stands on a group's list, by Fantrax id: a rostered man where his manager has him in one of its positions,
 *  and a man on no roster wherever the league lets him play one. */
export function defconSeats(entries: readonly PoolPlayer[], positions: readonly string[]): string[] {
  return entries.flatMap((entry) =>
    (entry.slot === null ? entry.eligiblePositions.some((at) => positions.includes(at)) : positions.includes(entry.slot))
      ? [entry.player.fantraxId]
      : [],
  );
}

/** One man our league lists, by FPL code. */
export interface Listed {
  fantraxId: string;
  held: Held;
}

export function gameweekLeaders(opts: {
  snapshot: Pick<FootballSnapshot, "clubs" | "players">;
  stats: readonly PlayerMatchStats[];
  /** Fantrax's live points at each rostered man's slot, eleven and reserves alike, by Fantrax id. */
  priced: ReadonlyMap<string, number>;
  /** Fantrax's points for the whole pool this period, by Fantrax id: where a free agent's come from. */
  pooled: ReadonlyMap<string, number>;
  /** The stats league's DefCon count for each group this gameweek, each by Fantrax id. */
  defcon: readonly (DefconGroup & { counts: Readonly<Record<string, number | null>> })[];
  /** The bridge: a Fantrax id's FPL code, or null. */
  codeOf: (fantraxId: string) => number | null;
  /** Every man our league lists, by FPL code. */
  listed: ReadonlyMap<number, Listed>;
  hrefOf: (fantraxId: string) => string;
  shown: number;
}): TopBoard[] {
  const byId = playerById(opts.snapshot);
  const byCode = playerByCode(opts.snapshot);
  const clubs = clubById(opts.snapshot);

  // Each figure held to the places its list prints, so two who read alike share a place.
  const rows = (list: LeaderList, totals: ReadonlyMap<FootballPlayer, number>): TopRow[] =>
    ranked(
      [...totals].map(([player, figure]) => ({ code: player.code, name: player.name, figure: asPrinted(list, figure) })),
      opts.shown,
    ).map((leader) => {
      const player = byCode.get(leader.code);
      const listed = opts.listed.get(leader.code);
      return {
        ...leader,
        club: player === undefined ? undefined : clubs.get(player.clubId),
        href: listed === undefined ? null : opts.hrefOf(listed.fantraxId),
        held: listed?.held.ownerTeamId == null ? null : listed.held,
        footballer: player,
      };
    });

  // Fantrax's figures by Fantrax id, joined through the bridge; a man it cannot place is dropped.
  const fantrax = (figures: Iterable<[string, number | null]>) => {
    const totals = new Map<FootballPlayer, number>();
    for (const [fantraxId, figure] of figures) {
      const code = opts.codeOf(fantraxId);
      const player = code === null ? undefined : byCode.get(code);
      if (player !== undefined && figure !== null) totals.set(player, figure);
    }
    return totals;
  };

  // FPL writes the round's figure on each of a man's rows, so a double gameweek reads it once.
  const football = (list: LeaderList, measure: (row: PlayerMatchStats) => number) => {
    const round = new Map<FootballPlayer, number>();
    for (const row of opts.stats) {
      const player = byId.get(row.playerId);
      if (player !== undefined && row.minutes > 0) round.set(player, measure(row));
    }
    return rows(list, round);
  };

  // The live read prices a rostered man at his slot; the pool's figure stands only for a man it did not price.
  const points = new Map(opts.pooled);
  for (const [fantraxId, figure] of opts.priced) points.set(fantraxId, figure);

  return [
    { key: "points", tab: "Points", list: POINTS, rows: rows(POINTS, fantrax(points)) },
    ...opts.defcon.map((group) => {
      const { tab, list } = defconList(group);
      return { key: list.key, tab, list, rows: rows(list, fantrax(Object.entries(group.counts))) };
    }),
    { key: "xg", tab: "xG", list: XG, rows: football(XG, (row) => row.expectedGoals) },
    { key: "xa", tab: "xA", list: XA, rows: football(XA, (row) => row.expectedAssists) },
  ];
}
