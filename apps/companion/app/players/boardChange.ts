import type { PlayersQuery } from "./query";
import { POOL } from "./routes";
import { FREE } from "../ownerWords";

// One board control's own change to the query, applied to the server's (its no-script link) or to the one last asked
// for. No heavier imports, so a client control can reach it without the column table.

/** What a control changes: `keep` clears every other key, `set` puts a value (an empty one drops it; a server's
 *  `undefined` never reaches the client), `toggle` adds or takes away one value of a comma list, and `status` is a
 *  status chip's, read against the statuses the board shows (`statusesShown`). */
export interface BoardChange {
  keep?: readonly string[];
  set?: Readonly<Record<string, string | undefined>>;
  toggle?: readonly [name: string, value: string];
  /** `only`: a row chip, showing its codes alone or, when all are on, taking them off. Else each code on or off. */
  status?: { codes: readonly string[]; only?: boolean };
}

/** `?status=all`: every man, since an absent status is the free men. */
export const EVERYONE = "all";

/** The search a change leaves; each parameter keeps its place, and a toggle's last value off drops it. */
export function changed(search: string, change: BoardChange): string {
  const params = new URLSearchParams(search);
  if (change.keep) for (const name of [...params.keys()]) if (!change.keep.includes(name)) params.delete(name);
  // A page's rows ride with Show all: a change that names one and not the other leaves a new list or all of it.
  if (change.set && Object.hasOwn(change.set, "all") && !Object.hasOwn(change.set, "rows")) params.delete("rows");
  for (const [name, value] of Object.entries(change.set ?? {})) {
    if (value) params.set(name, value);
    else params.delete(name);
  }
  if (change.toggle) {
    const [name, value] = change.toggle;
    const on = chosen(params.get(name));
    const next = on.includes(value) ? on.filter((entry) => entry !== value) : [...on, value];
    if (next.length > 0) params.set(name, next.join(","));
    else params.delete(name);
  }
  if (change.status) {
    const next = statusAfter(params, change.status);
    if (next) params.set("status", next);
    else params.delete("status");
  }
  return params.toString();
}

/** The link a control's change makes of the server's query: its href with no script. */
export function changeHref(query: PlayersQuery, change: BoardChange, route: string = POOL): string {
  return atRoute(route, changed(changed("", { set: { ...query } }), change));
}

/** A position chip's change: its value on or off, and Show all off, since the rows it showed are not the ones left. */
export function filterChange(key: "pos", value: string): BoardChange {
  return { toggle: [key, value], set: { all: "" } };
}

/** A status chip's change, Show all off as for any filter. */
export function statusChange(codes: readonly string[], only = false): BoardChange {
  return { status: { codes, only }, set: { all: "" } };
}

/** The statuses the board lists, null for every man: absent is the free men (Craig, 16 Oct 2026), except under a
 *  typed search, which looks through everyone. */
export function statusesShown(status: string | null | undefined, typed: string | null | undefined): string[] | null {
  const asked = chosen(status);
  if (asked.includes(EVERYONE)) return null;
  if (asked.length > 0) return asked;
  return (typed ?? "").trim() === "" ? [...FREE] : null;
}

/** Whether a status chip is pressed: every one of its codes among those shown, and none for everyone. */
export function statusOn(
  status: string | null | undefined,
  typed: string | null | undefined,
  codes: readonly string[],
): boolean {
  const shown = statusesShown(status, typed);
  return shown !== null && codes.every((code) => shown.includes(code));
}

/** The `status` a chip's change leaves: "" where that is the resting board, `EVERYONE` where nothing is left. */
function statusAfter(params: URLSearchParams, change: NonNullable<BoardChange["status"]>): string {
  const shown = statusesShown(params.get("status"), params.get("q")) ?? [];
  const lit = change.codes.every((code) => shown.includes(code));
  const next = lit
    ? shown.filter((code) => !change.codes.includes(code))
    : change.only
      ? [...change.codes]
      : [...shown, ...change.codes.filter((code) => !shown.includes(code))];
  if (next.length === 0) return EVERYONE;
  const resting = next.length === FREE.length && FREE.every((code) => next.includes(code));
  return resting && (params.get("q") ?? "").trim() === "" ? "" : next.join(",");
}

/** The values chosen for one filter, a comma list in one parameter (`?pos=D,M`), blanks dropped. */
export function chosen(value: string | null | undefined): string[] {
  return (value ?? "").split(",").filter(Boolean);
}

/** A route with its search, and no question mark when there is none. */
export function atRoute(route: string, search: string): string {
  return search ? `${route}?${search}` : route;
}
