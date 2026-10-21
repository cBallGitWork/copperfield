import { seasonKey } from "@epl/core";
import type { PastSeason } from "@epl/core";
import { seasonValue, type CompareField } from "../routes";

// A side's season on Compare (Craig, 21 Oct 2026): `?as=` / `?bs=` name a completed season as "2024-25"; absent is this one.

/** Each side's season parameter. */
export const SEASON_PARAM = { a: "as", b: "bs" } as const satisfies Record<"a" | "b", CompareField>;

/** The completed season the URL asked for, or null for this season: a season he never played is this season too. */
export function pickedSeason(asked: string | undefined, past: readonly PastSeason[] | null): PastSeason | null {
  if (asked === undefined || past === null) return null;
  return past.find((season) => seasonValue(season.season) === asked) ?? null;
}

/** A season as the bar prints it, "24/25"; null for a label in no shape we know. */
export function shortSeason(label: string | null): string | null {
  const key = label === null ? null : seasonKey(label);
  return key === null ? null : key.replace("-", "/");
}

/** A side's name with its season after it, "Haaland 24/25"; the bare name when the season will not print. */
export function seasonName(name: string, label: string | null): string {
  const short = shortSeason(label);
  return short === null ? name : `${name} ${short}`;
}

/** His most recent completed season other than `except`, for "vs his last season"; null when he has none. */
export function lastSeason(past: readonly PastSeason[] | null, except: string | null): PastSeason | null {
  return past?.find((season) => season.season !== except) ?? null;
}
