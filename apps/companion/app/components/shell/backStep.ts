// Where the phone's back plate goes. No `"use client"`: a pure decision, so it can be tested.

/** Each page's path, and the URL (path and query) the reader tapped it from. */
export type Trail = Record<string, string>;

/** How many pages the trail remembers; a session's taps past that are forgotten oldest first. */
const TRAIL_LENGTH = 40;

/** Whether a tap replaces its page: a `data-replace` link (a tab), unless it sits on a card's own history entry
 *  (`Modal`'s `{ modal }`), whose replace is a push from the page under the card. */
export function tapReplaces(marked: boolean, state: unknown): boolean {
  return marked && !(typeof state === "object" && state !== null && "modal" in state);
}

/** The trail after a tap from `from` to `to`: a push files `to` under `from`, a replace hands `to` the origin of the
 *  page it replaces, and a link to the page it is on files nothing. */
export function afterTap(trail: Trail, from: string, to: string, replace: boolean): Trail {
  const page = pathOf(to);
  if (page === pathOf(from)) return trail;
  const origin = replace ? trail[pathOf(from)] : from;
  if (origin === undefined) return trail;
  const kept = Object.entries(trail).filter(([key]) => key !== page).slice(-(TRAIL_LENGTH - 1));
  return { ...Object.fromEntries(kept), [page]: origin };
}

/** Back whenever the browser names a page behind. Only when it has none (the installed iPhone lost one) or cannot say,
 *  the page the reader came from (`origin`) in this one's place, unless the plate has already stepped from it
 *  (`stepped`, the pages left since the last tap), which would loop; then, and for a page opened cold, the section's
 *  list. `behind` is the URL of the browser's page behind: null when it has none, undefined where it cannot say. */
export function backStep(
  origin: string | null,
  behind: string | null | undefined,
  historyLength: number,
  stepped: readonly string[],
): "back" | "list" | { to: string } {
  if (behind != null) return "back";
  if (origin !== null) return stepped.includes(pathOf(origin)) ? "list" : { to: origin };
  return behind === null ? "list" : historyStep(historyLength);
}

/** Back where the history has a page behind this one, by its length alone; the list where it has none. */
export function historyStep(historyLength: number): "back" | "list" {
  return historyLength > 1 ? "back" : "list";
}

/** The page a URL or path is, without its query. */
export function pathOf(url: string): string {
  return url.split(/[?#]/)[0];
}
