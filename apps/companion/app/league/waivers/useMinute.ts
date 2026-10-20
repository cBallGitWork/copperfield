"use client";

import { useSyncExternalStore } from "react";
import { MS_PER_MINUTE, MS_PER_SECOND } from "@epl/core";

// The clock a countdown reads, to the minute: the server's instant while hydrating, so both render the same, then the
// phone's own, checked often enough to turn over within seconds of each minute.

const CHECK_MS = 15 * MS_PER_SECOND;

function subscribe(changed: () => void): () => void {
  const timer = setInterval(changed, CHECK_MS);
  return () => clearInterval(timer);
}

/** Now, in milliseconds, held still within a minute so the store's answer is stable between checks. */
function minute(): number {
  return Math.floor(Date.now() / MS_PER_MINUTE) * MS_PER_MINUTE;
}

export function useMinute(serverNow: string): number {
  return useSyncExternalStore(subscribe, minute, () => Date.parse(serverNow));
}
