import {
  FANTRAX_LEAGUE_ID,
  FITNESS_DAYS,
  MS_PER_DAY,
  fantraxInstant,
  fetchPlayerStories,
  fplCodeOf,
  isActive,
  isResolved,
  londonDayOf,
  londonWeekdayLong,
  mapPlayerStories,
  type Fixture,
  type HeadToHeadStake,
  type LeagueTeam,
  type LeagueTransaction,
  type PlayerStory,
  type ReportMan,
} from "@epl/core";
import { BRIDGE } from "./bridge";
import type { DeskFacts } from "./facts";
import { involves } from "@epl/core";

// The league's side of a match report: who has each footballer at the match's period, his points, the club's word on
// him, and this gameweek's claims and drops.

interface LeagueJoin {
  holders: Map<number, NonNullable<ReportMan["holder"]>>;
  /** Free agents let go this gameweek, by code. */
  dropped: Map<number, NonNullable<ReportMan["dropped"]>>;
  /** Points for the men in a manager's eleven, at their slot, and that slot's letter. */
  points: Map<number, number>;
  slots: Map<number, string>;
  fantraxIds: Map<number, string>;
}

type Move = NonNullable<ReportMan["dropped"]>;

/** Whether an instant falls on a London day after `day`. */
const afterDay = (iso: string | null, day: string) => (londonDayOf(iso) ?? "") > day;

/** Each man's last claim or drop in `period`, made by the end of `day` (London), with the side and the weekday. */
export function movesBy(rows: readonly LeagueTransaction[], period: number | null, day: string, teamName: ReadonlyMap<string, string>): { claimed: Map<string, Move>; dropped: Map<string, Move> } {
  const last = new Map<string, { row: LeagueTransaction; at: string }>();
  for (const row of rows) {
    const at = row.processedAt === null ? null : fantraxInstant(row.processedAt);
    if (!row.executed || row.period !== period || (row.kind !== "claim" && row.kind !== "drop") || at === null || afterDay(at, day)) continue;
    if ((last.get(row.fantraxId)?.at ?? "") < at) last.set(row.fantraxId, { row, at });
  }
  const claimed = new Map<string, Move>();
  const dropped = new Map<string, Move>();
  for (const [id, { row, at }] of last) {
    const team = teamName.get((row.kind === "claim" ? row.toTeamId : row.fromTeamId) ?? "");
    if (team !== undefined) (row.kind === "claim" ? claimed : dropped).set(id, { team, day: londonWeekdayLong(at) });
  }
  return { claimed, dropped };
}

/** Holders from every slot, fielded from the active ones; points only where his club plays once in the period. `day` is the
 *  report's: a tie is over when no match of the period comes after it. */
export function leagueJoin(facts: DeskFacts, periodFixtures: readonly Fixture[], clubOfCode: ReadonlyMap<number, number>, day: string, period: number | null): LeagueJoin {
  const fantraxIds = new Map<number, string>();
  for (const fantraxId of Object.keys(BRIDGE)) {
    const code = fplCodeOf(BRIDGE, fantraxId);
    if (code !== null) fantraxIds.set(code, fantraxId);
  }
  // Each side's head-to-heads this gameweek, by team name, both of a double header: the stake a mate in the league would give.
  const h2h = new Map<string, HeadToHeadStake[]>();
  const over = periodFixtures.length > 0 && periodFixtures.every((f) => f.status === "finished" && !afterDay(f.kickoff, day));
  const score = (id: string) => facts.scores.get(id)?.points ?? null;
  const tie = (us: LeagueTeam, them: LeagueTeam) =>
    h2h.set(us.name, [...(h2h.get(us.name) ?? []), { opponent: them.name, us: score(us.teamId), them: score(them.teamId), over }]);
  for (const { home, away } of facts.pairings) {
    tie(home, away);
    tie(away, home);
  }
  const teamName = new Map([...facts.pairings.flatMap((p) => [p.home, p.away]).map((t) => [t.teamId, t.name] as const), ...facts.teams.map((t) => [t.teamId, t.teamName] as const)]);
  const moves = movesBy(facts.moves, period, day, teamName);
  const holders = new Map<number, NonNullable<ReportMan["holder"]>>();
  const points = new Map<number, number>();
  const slots = new Map<number, string>();
  const matchesOf = (clubId: number) => periodFixtures.filter((f) => involves(f, clubId)).length;
  for (const team of facts.teams) {
    for (const man of team.players.filter(isResolved)) {
      const fielded = isActive(man.slot);
      const claim = moves.claimed.get(man.slot.fantraxId);
      const since = claim?.team === team.teamName ? claim.day : null;
      holders.set(man.player.code, { team: team.teamName, fielded, round: facts.pedigree.get(man.slot.fantraxId)?.round ?? null, h2h: h2h.get(team.teamName) ?? [], since });
      if (!fielded) continue;
      if (man.slot.position !== null) slots.set(man.player.code, man.slot.position);
      const clubId = clubOfCode.get(man.player.code);
      const scored = facts.playerPoints.get(man.slot.fantraxId);
      if (scored !== undefined && clubId !== undefined && matchesOf(clubId) === 1) points.set(man.player.code, scored);
    }
  }
  const dropped = new Map<number, Move>();
  for (const [code, id] of fantraxIds) {
    const move = moves.dropped.get(id);
    if (move !== undefined && !holders.has(code)) dropped.set(code, move);
  }
  return { holders, dropped, points, slots, fantraxIds };
}

/** Fantrax's stories on one man, none when they cannot be read. */
export const storiesOn = (fantraxId: string): Promise<PlayerStory[]> => fetchPlayerStories(FANTRAX_LEAGUE_ID, fantraxId).then(mapPlayerStories).catch(() => []);

/** The headline of the first story published after a match kicked off and within a few days of it, and by `until` when
 *  one is given; null when there is none. */
export function firstStoryAfter(stories: readonly PlayerStory[], kickoff: string, until = Infinity): string | null {
  const from = Date.parse(kickoff);
  const last = Math.min(from + FITNESS_DAYS * MS_PER_DAY, until);
  return stories.filter((s) => s.at !== null && s.at > from && s.at <= last).sort((a, b) => (a.at ?? 0) - (b.at ?? 0))[0]?.headline ?? null;
}

/** Fantrax's first story on each man taken off injured, published after the match and within a few days of it. */
export async function fitnessAfter(codes: readonly number[], kickoff: string, fantraxIds: ReadonlyMap<number, string>): Promise<Map<number, string>> {
  const out = new Map<number, string>();
  await Promise.all(
    codes.map(async (code) => {
      const id = fantraxIds.get(code);
      if (id === undefined) return;
      const story = firstStoryAfter(await storiesOn(id), kickoff);
      if (story !== null) out.set(code, story);
    }),
  );
  return out;
}
