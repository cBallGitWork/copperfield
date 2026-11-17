import { LEAGUE_TIMEZONE } from "@epl/core";
import { SQUAD } from "./squad/routes";

// The player section is for the league's managers: crawlers walked its every sort and filter, each an uncached render
// (Craig, 17 Nov 2026: "have to enter the code to get signed in to access that section"). The code goes in on Squad only.

/** The section only a signed-in manager reads. */
export const GATED = "/players";

/** Whether a path is in the gated section: `/players` and everything under it, never `/playersfoo`. */
export function gated(pathname: string): boolean {
  return pathname === GATED || pathname.startsWith(`${GATED}/`);
}

/** Squad's sign-in, carrying the page a refused reader asked for. */
export function signInFor(pathAndQuery: string): string {
  return `${SQUAD}?next=${encodeURIComponent(pathAndQuery)}`;
}

/** The page to land on after signing in, or null: only ever inside the gated section, so `next` sends nobody off-site. */
export function returnTo(raw: unknown): string | null {
  if (typeof raw !== "string" || raw.includes("\\")) return null;
  return /^\/players(?:[/?#]|$)/.test(raw) ? raw : null;
}

/** London hours the section is offline for everybody, from `from` up to `to` (Craig, 17 Nov 2026: "between midnight
 *  and 7am take that page offline"): nobody in the league reads it then, and a crawler would. */
export const CLOSED_HOURS = { from: 0, to: 7 } as const;

/** The London hour, 0 to 23, at an instant. */
export function londonHour(at: Date): number {
  return Number(new Intl.DateTimeFormat("en-GB", { timeZone: LEAGUE_TIMEZONE, hour: "2-digit", hourCycle: "h23" }).format(at));
}

/** Whether the section is offline at an instant. */
export function closedAt(at: Date): boolean {
  const hour = londonHour(at);
  return hour >= CLOSED_HOURS.from && hour < CLOSED_HOURS.to;
}

/** What a reader sees overnight: one line, served by the proxy, so the night costs no render. */
export const CLOSED_PAGE = `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Players — closed overnight</title><body style="font-family:system-ui;padding:2rem;background:#0b0f14;color:#e6e6e6"><p>The player section is closed from midnight to 7am. <a href="/" style="color:inherit">Back to the paper</a></p>`;
