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
