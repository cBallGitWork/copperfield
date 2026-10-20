import { reloadsHeld } from "./unsaved";

// An installed app keeps the deployment it opened on (Vercel's skew protection pins its requests with `dpl=`), and the
// paper and every committed file are built in, so a refresh kept printing the old ones (Craig, 16 Oct 2026). Asking an
// unpinned route which deployment is live, and reloading onto it, is what a hard open did.

/** The address that names the live deployment; a plain fetch is never pinned. */
const DEPLOYMENT_ROUTE = "/api/deployment";
/** The fewest milliseconds between two asks, outside a pull. */
const ASK_EVERY_MS = 60_000;

/** The deployment a page's own scripts were served from, or null where nothing pins them (local, preview of none). */
export function deploymentOf(sources: readonly string[]): string | null {
  for (const source of sources) {
    const id = /[?&]dpl=([A-Za-z0-9_]+)/.exec(source)?.[1];
    if (id !== undefined) return id;
  }
  return null;
}

/** Whether `live` is a different deployment from the one this page runs; an unknown either side is never stale. */
export function behind(mine: string | null, live: string | null): boolean {
  return mine !== null && live !== null && live !== mine;
}

let askedAt = 0;

/** Reloads onto the live deployment when this page is behind it and nothing unsaved would be lost; true if it did. */
export async function reloadIfBehind(force = false): Promise<boolean> {
  const now = Date.now();
  if (!force && now - askedAt < ASK_EVERY_MS) return false;
  askedAt = now;
  const mine = deploymentOf([...document.scripts].map((script) => script.src));
  if (mine === null) return false;
  try {
    const response = await fetch(DEPLOYMENT_ROUTE, { cache: "no-store" });
    const { deployment } = (await response.json()) as { deployment?: string | null };
    if (!behind(mine, deployment ?? null) || reloadsHeld()) return false;
    location.reload();
    return true;
  } catch {
    // Offline or refused: the ordinary refresh still runs.
    return false;
  }
}
