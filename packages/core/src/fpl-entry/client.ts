import { FPL_API_BASE } from "../config";
import { expectContainer, fetchJsonOr404 } from "../http/get";
import type { RawEntry, RawPicks } from "./raw";

// The two public entry reads, and nothing else: an entry id is not a credential, and FPL's authenticated reads stay out.

/** The body as an object, or null for FPL's 404. */
async function getOr404<T>(path: string, what: string): Promise<T | null> {
  const body = await fetchJsonOr404(`${FPL_API_BASE}${path}`, "FPL", what);
  return body === null ? null : (expectContainer(body, "object", "FPL", what) as T);
}

/** A manager's entry, or null when FPL has never heard of the id: a mistyped id is ordinary. Anything else throws. */
export function fetchEntry(entryId: number): Promise<RawEntry | null> {
  return getOr404<RawEntry>(`/entry/${entryId}/`, `entry ${entryId}`);
}

/** One round's picks, or null for FPL's 404 on a gameweek the entry has no picks for, as before the season. */
export function fetchPicks(entryId: number, gameweek: number): Promise<RawPicks | null> {
  return getOr404<RawPicks>(`/entry/${entryId}/event/${gameweek}/picks/`, `picks ${entryId}/${gameweek}`);
}
