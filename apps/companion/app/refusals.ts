import { FantraxError, ProviderError } from "@epl/core";

// A provider answering "no", or not answering, is not this app failing. A refusal Fantrax meant
// is a state to model and cache; no answer at all is never stored; anything else is our bug.

/** A page that cannot show what it exists to show, carrying the provider's own
 *  tell so the panel can print it. */
export interface Unavailable {
  unavailable: string;
}

/** What was asked and what came back: "getTeamRosters → NO_TEAMS" from Fantrax, or the host, path
 *  and code of a provider that never answered. Built from the error, never written at a call site. */
export function tell(error: ProviderError): string {
  return error instanceof FantraxError ? `${error.method} → ${error.code}` : error.message;
}

/** The page's refusal panel for a provider that said no, or nothing. */
export function unavailable(error: ProviderError): Unavailable {
  return { unavailable: tell(error) };
}

/** Why a read fell back: its deadline passed, the provider said no or did not answer, or the answer was misshapen. */
export function fallbackReason(error: ProviderError): "timeout" | "refused" | "shape" {
  if (error.code === "TIMEOUT") return "timeout";
  return error.kind === "malformed" ? "shape" : "refused";
}

/** One JSON line per read drawn as its empty answer, so a matchday's empties can be counted. Codes only, never a
 *  message: a body sample or a header has no place in a log. */
export function logFallback(key: string, error: ProviderError, startedAt: number): void {
  const line = { event: "fantrax-fallback", key, reason: fallbackReason(error), code: error.code, ms: Date.now() - startedAt };
  console.warn(JSON.stringify(line));
}

/** The read, or the refusal Fantrax meant, logged under its method. An outage still throws, so a cache keeps its last
 *  good answer rather than holding the outage as one. */
export async function orRefusal<T>(read: Promise<T>): Promise<T | FantraxError> {
  const startedAt = Date.now();
  try {
    return await read;
  } catch (error: unknown) {
    if (!(error instanceof FantraxError && error.kind === "refused")) throw error;
    logFallback(error.method, error, startedAt);
    return error;
  }
}

/** The read through `map`, or `refused`'s answer when Fantrax said no; an outage still throws, as `orRefusal` says. */
export async function refusedAs<T, R, E>(read: Promise<T>, refused: (error: FantraxError) => E, map: (raw: T) => R): Promise<R | E> {
  const raw = await orRefusal(read);
  return raw instanceof FantraxError ? refused(raw) : map(raw);
}

/** The read, or `degrade`'s answer when a provider failed it. A bug of ours still throws. */
export async function orDegraded<T, D>(read: Promise<T>, degrade: (error: ProviderError) => D): Promise<T | D> {
  try {
    return await read;
  } catch (error: unknown) {
    if (error instanceof ProviderError) return degrade(error);
    throw error;
  }
}
