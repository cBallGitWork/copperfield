import { playerByCode } from "../football/selectors";
import { groupedBy } from "../grouped";
import type { FootballPlayer, FootballSnapshot, PlayerMatchStats } from "../football/types";
import { type Bridge, type BridgeEntry, isUnmapped } from "../identity/bridge";
import type { PeriodRosters, RosterSlot } from "../league/types";

// Where the two layers meet: the one file importing both. The bridge is passed in, since core cannot read data/.

/** Why a rostered slot has no footballer behind it: three different things, only one of them fine. */
export type Unresolved =
  /** Recorded as having no FPL counterpart, an academy or fringe man: correct, not a failure. */
  | "unmapped"
  /** The bridge has never seen this id: he joined the pool since the last `npm run bridge`. */
  | "unbridged"
  /** Bridged to a code no player in this snapshot has: FPL dropped him, or the snapshot predates him. */
  | "absent";

export interface ResolvedPlayer {
  slot: RosterSlot;
  player: FootballPlayer;
  /** One row per fixture his CLUB has this gameweek, not per appearance; empty only before the first whistle.
   *  So `stats.length` says the round has started, never that he played: `minutes > 0` is the appearance test. */
  stats: PlayerMatchStats[];
}

interface UnresolvedPlayer {
  slot: RosterSlot;
  unresolved: Unresolved;
}

/** One roster slot, resolved as far as the bridge allows; an unresolved slot is still a man the manager holds. */
export type RosteredPlayer = ResolvedPlayer | UnresolvedPlayer;

export function isResolved(rostered: RosteredPlayer): rostered is ResolvedPlayer {
  return "player" in rostered;
}

export interface RosteredTeam {
  teamId: string;
  teamName: string;
  players: RosteredPlayer[];
}

export interface RosteredPeriod {
  /** Carried from the rosters, never inferred from the snapshot's gameweek: only the league knows its period. */
  period: number | null;
  teams: RosteredTeam[];
}

/** Whether the rosters held are the ones this round was played with. Fantrax's period rolls on when a round's last
 *  fixture ends, so when it differs from `roundPeriod` any claim about who started must be withheld. */
export function wasFielded(rostered: RosteredPeriod, roundPeriod: number | null): boolean {
  return rostered.period !== null && rostered.period === roundPeriod;
}

export function resolveRosters(
  snapshot: FootballSnapshot,
  rosters: PeriodRosters,
  bridge: Bridge,
): RosteredPeriod {
  const players = playerByCode(snapshot);
  // Built once per call rather than scanned per slot: it runs on every live poll.
  const stats = groupedBy(snapshot.stats, (row) => row.playerId);

  return {
    period: rosters.period,
    teams: rosters.teams.map((team) => ({
      teamId: team.teamId,
      teamName: team.teamName,
      players: team.slots.map((slot) => resolveSlot(slot, players, stats, bridge)),
    })),
  };
}

function resolveSlot(
  slot: RosterSlot,
  players: Map<number, FootballPlayer>,
  stats: Map<number, PlayerMatchStats[]>,
  bridge: Bridge,
): RosteredPlayer {
  // Annotated: without `noUncheckedIndexedAccess` the index reads as always present, and rosters name unbridged ids.
  const entry: BridgeEntry | undefined = bridge[slot.fantraxId];
  if (!entry) return { slot, unresolved: "unbridged" };
  if (isUnmapped(entry)) return { slot, unresolved: "unmapped" };

  const player = players.get(entry.fplCode);
  if (!player) return { slot, unresolved: "absent" };

  // Keyed by FPL's per-season id, safe only because both sides come from one snapshot; the bridge holds codes.
  return { slot, player, stats: stats.get(player.id) ?? [] };
}
