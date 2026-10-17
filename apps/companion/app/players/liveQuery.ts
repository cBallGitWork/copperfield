import { useEffect, useSyncExternalStore } from "react";
import { useSearchParams } from "next/navigation";
import { atRoute, changed, type BoardChange } from "./boardChange";

// The board's query as last asked for, ahead of the server: a tap builds on it, so a second tap before the first
// lands keeps both. The URL stays the authority; this only remembers what is on its way to it.

let asked: string | null = null;
/** Each query asked for since the last landed, and the one they started from; landing on any other is not ours. */
const pending = new Set<string>();
const listeners = new Set<() => void>();
let mounted = 0;

function remember(search: string | null): void {
  asked = search;
  if (search === null) pending.clear();
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Applies a control's change to the query last asked for, remembers it, and answers where to go. */
export function ask(change: BoardChange): string {
  const from = asked ?? new URLSearchParams(location.search).toString();
  const search = changed(from, change);
  pending.add(from).add(search);
  remember(search);
  return atRoute(location.pathname, search);
}

/** The query last asked for, or null once the board has landed (on it, or on a link that was not ours). Every board
 *  control calls it, and the board forgets when the last one leaves. */
export function useAsked(): URLSearchParams | null {
  const landed = useSearchParams().toString();
  useEffect(() => {
    if (asked !== null && (landed === asked || !pending.has(landed))) remember(null);
  }, [landed]);
  useEffect(() => {
    mounted += 1;
    return () => {
      mounted -= 1;
      if (mounted === 0) remember(null);
    };
  }, []);
  const search = useSyncExternalStore(subscribe, () => asked, () => null);
  return search === null ? null : new URLSearchParams(search);
}
