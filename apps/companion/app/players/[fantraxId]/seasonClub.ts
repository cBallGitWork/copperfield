import { fullClubName, type Club } from "@epl/core";

/** A season's club, the store's full name, as this season's FPL code ("Manchester City" → "MCI"); null for a club
 *  not in the league now, which has no code to print. */
export function seasonClubCode(name: string, clubs: Iterable<Pick<Club, "name" | "shortName">>): string | null {
  for (const club of clubs) if (club.name === name || fullClubName(club.name) === name) return club.shortName;
  return null;
}
