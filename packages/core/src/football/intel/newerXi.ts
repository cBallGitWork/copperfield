import type { IntelXi } from "./types";

/** The newer of two readings of the predicted elevens: `read`, off the wire and untrusted, only when it has the file's
 *  shape and a later `fetchedAt` than `held`, the copy that passed the build; otherwise `held`. */
export function newerElevens(read: unknown, held: IntelXi): IntelXi {
  if (!isElevens(read) || read.fetchedAt === null) return held;
  if (held.fetchedAt !== null && !(Date.parse(read.fetchedAt) > Date.parse(held.fetchedAt))) return held;
  return read;
}

function isElevens(value: unknown): value is IntelXi {
  if (!isRecord(value) || !isRecord(value.manifest) || !isRecord(value.clubs)) return false;
  if (value.fetchedAt !== null && typeof value.fetchedAt !== "string") return false;
  return Object.values(value.clubs).every((club) => isRecord(club) && typeof club.formation === "string" && Array.isArray(club.starters));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
