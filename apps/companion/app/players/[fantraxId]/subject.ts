import { notFound } from "next/navigation";
import {
  FANTRAX_LEAGUE_ID,
  fetchPlayerProfile,
  isFantraxPlayerId,
  mapPlayerProfile,
} from "@epl/core";
import { leagueRead } from "../../leagueCache";
import type { Club, FootballPlayer, PlayerIntel } from "@epl/core";
import { unavailable } from "../../refusals";
import type { Unavailable } from "../../refusals";
import { getLeagueSquads, readable } from "../../squads";
import { getLeaguePool } from "../pool";
import { footballSelf } from "./footballSelf";
import { unknownToPool } from "./unknown";

// Who a player screen is about: Fantrax's profile and the footballer behind it. Fantrax throttles `getPlayerProfile`
// at about 27 calls, so it is one per tap and nothing may loop over it.

export interface Subject {
  intel: PlayerIntel;
  /** The footballer behind the Fantrax id, and his club; null for a man FPL has never listed. */
  football: { player: FootballPlayer; club: Club | undefined } | null;
  /** The fantasy side holding him, by its short name, for the bar's brackets; null for a free agent or a silent league. */
  ownerName: string | null;
}

/** One profile per player for everybody: four tabs and every phone ask Fantrax once. The
 *  refusal is caught inside, because a `FantraxError` thrown through the cache need not arrive as one. */
const readProfile = leagueRead("player-profile", (fantraxId: string) => fetchPlayerProfile(FANTRAX_LEAGUE_ID, fantraxId),
  (raw) => raw, unavailable);

/** An id not in Fantrax's shape, or one the pool answered without, is a 404. A man the pool holds whose profile
 *  read was refused keeps the tell on screen. */
export async function subject(fantraxId: string): Promise<Subject | Unavailable> {
  if (!isFantraxPlayerId(fantraxId)) notFound();
  const raw = await readProfile(fantraxId);
  if ("unavailable" in raw) {
    if (unknownToPool(await getLeaguePool(), fantraxId)) notFound();
    return raw;
  }
  const intel = mapPlayerProfile(raw);
  // After the profile, so neither can fail it; both read caches every screen keeps warm.
  const [football, ownerName] = await Promise.all([
    footballSelf(fantraxId),
    teamName(intel.ownerTeamId),
  ]);
  return { intel, football, ownerName };
}

/** The owning side's name off the rosters, never parsed out of the profile's wording; null on any ordinary failure. */
async function teamName(ownerTeamId: string | null): Promise<string | null> {
  if (ownerTeamId === null) return null;
  const squads = readable(await getLeagueSquads());
  if (squads === null) return null;
  return squads.period.teams.find((team) => team.teamId === ownerTeamId)?.teamName ?? null;
}
