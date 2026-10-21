import { seasonKey, shirtName } from "@epl/core";
import type { PastSeason } from "@epl/core";
import { manIn, manOver, type Found, type Man } from "./overWindow";
import type { SeasonOffer } from "./SeasonBar";
import { seasonName } from "./season";
import { pastSeasons } from "../[fantraxId]/grid";
import { pastMaps } from "../../pastMaps";

// The reads behind a side set in a completed season: his career for the select, and that season's line and maps.

/** FPL's web name where we have it; Fantrax's full registration is too long for the bar. */
export function shirtOf(side: Found | null): string | null {
  if (side === null) return null;
  return side.football ? shirtName(side.football.player.name) : side.intel.name;
}

/** A side's name, with its season after it once any side is past: "Haaland 24/25" against "Haaland 26/27". */
export function sideName(side: Found | null, season: PastSeason | null, past: boolean): string | null {
  const name = shirtOf(side);
  if (name === null || side === null || !past) return name;
  return seasonName(name, season?.season ?? side.intel.season);
}

/** His completed seasons with a minute in them, or null for a man with no football half or a history that is silent. */
export async function careerOf(side: Found | null): Promise<PastSeason[] | null> {
  if (!side?.football) return null;
  const career = await pastSeasons(side.football.player);
  return career === null ? null : career.filter((season) => season.minutes > 0);
}

/** One side's season select, or none for a man with no season before this one. */
export function offerOf(side: Found | null, name: string | null, career: readonly PastSeason[] | null): SeasonOffer | null {
  if (side === null || name === null || career === null || career.length === 0) return null;
  return { name, current: side.intel.season, past: career };
}

/** One side as the views draw it: this season over the window, or the completed season the URL named. */
export async function sideOf(
  side: Found,
  name: string,
  season: PastSeason | null,
  window: Parameters<typeof manOver>[2],
): Promise<Man> {
  const code = side.football?.player.code;
  if (season === null || code === undefined) return manOver(side, name, window);
  return manIn(name, season, await pastMaps(seasonKey(season.season), code));
}
