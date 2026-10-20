"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { nextPoll, settleAfter } from "./cadence";
import type { Ahead } from "./sections";
import { reloadIfBehind } from "./newerBuild";
import { LIVE_REVALIDATE, POLL } from "../../config";

// Asks the server for a fresh render on a timer; `revalidate` never pushes to an open page.
// The rate is set here from `liveIn`, not on the server, so a tab opened before a match window wakes as it opens.
// It also fetches the rail's tabs ahead (`aheadOf`), so a tap draws at once, `POLL.ahead` after this page's own ask so
// they read what it fetched: at the same instant they landed on other instances and each asked FPL (19 Oct 2026).

/** The page's data, not just its route, as `<Link prefetch>` would fetch it. */
const FULL = { kind: "full" } as NonNullable<Parameters<ReturnType<typeof useRouter>["prefetch"]>[1]>;

export default function AutoRefresh({
  liveIn,
  ahead,
}: {
  liveIn: number | null;
  ahead: Ahead;
}) {
  const router = useRouter();
  // Strings, so new arrays of the same tabs on every render do not restart the clock.
  const each = ahead.each.join(" ");
  const once = ahead.once.join(" ");
  // `liveIn` counts down to the window, so the effect re-runs on each refresh; the heavy tabs are fetched only the first time.
  const fetchedOnce = useRef(false);
  // Outlives a re-run: the refresh that lands as a window opens changes `liveIn` before the second ask is due.
  const settling = useRef<ReturnType<typeof setTimeout>>(undefined);
  const warming = useRef<ReturnType<typeof setTimeout>>(undefined);
  const warmDue = useRef("");
  useEffect(
    () => () => {
      clearTimeout(settling.current);
      clearTimeout(warming.current);
    },
    [],
  );

  useEffect(() => {
    // The wall clock: `performance.now()` stops while a phone sleeps, and `liveIn` counts real seconds.
    const arrived = Date.now();
    let refreshed = arrived;
    let timer: ReturnType<typeof setTimeout>;

    // Asks that land inside one wait are fetched together at its end, so the open's heavy tabs survive a settle.
    const warm = (tabs: string) => {
      warmDue.current = `${warmDue.current} ${tabs}`;
      clearTimeout(warming.current);
      warming.current = setTimeout(() => {
        const due = new Set(warmDue.current.split(" "));
        warmDue.current = "";
        if (document.visibilityState !== "visible") return;
        for (const href of due) if (href !== "" && href !== location.pathname) router.prefetch(href, FULL);
      }, POLL.ahead * 1000);
    };
    const elapsed = () => (Date.now() - arrived) / 1000;

    // A hidden tab is skipped: refreshing it costs battery and upstream quota. A page behind the live deployment
    // reloads onto it instead, since a refresh would ask its own old build.
    const refresh = () => {
      if (document.visibilityState !== "visible") return;
      refreshed = Date.now();
      void reloadIfBehind().then((reloaded) => {
        if (reloaded) return;
        router.refresh();
        warm(each);
      });
    };

    // A stale read answers with its old reading and fetches behind it, so an open or a return asks once more.
    const settle = (since: number | null) => {
      const wait = settleAfter(liveIn, elapsed(), since, { lifetime: LIVE_REVALIDATE, settle: POLL.settle });
      if (wait === null) return;
      clearTimeout(settling.current);
      settling.current = setTimeout(refresh, wait * 1000);
    };
    const returned = () => {
      const since = (Date.now() - refreshed) / 1000;
      if (document.visibilityState !== "visible") return;
      refresh();
      settle(since);
    };

    const opened = () => {
      if (!fetchedOnce.current) settle(null);
      warm(fetchedOnce.current ? each : `${each} ${once}`);
      fetchedOnce.current = true;
    };

    const schedule = () => {
      timer = setTimeout(() => {
        refresh();
        schedule();
      }, nextPoll(liveIn, elapsed(), POLL) * 1000);
    };
    schedule();

    // The first fetch waits for the page's own load, so the tabs never compete with what is on screen.
    if (document.readyState === "complete") opened();
    else window.addEventListener("load", opened, { once: true });

    // Returning to the tab refreshes at once rather than waiting out the interval.
    document.addEventListener("visibilitychange", returned);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("load", opened);
      document.removeEventListener("visibilitychange", returned);
    };
  }, [router, liveIn, each, once]);

  return null;
}
