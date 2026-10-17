"use client";

import { useLayoutEffect } from "react";
import { currentEntry } from "./historyEntry";

// A list's place, kept per history entry: noted on every tap, put back when Back returns to that entry. The browser's
// own restore lands while the short letter is still drawn, which pinned it at the top (800 → 0).

const kept = new Map<string, number>();

export default function KeepScroll() {
  useLayoutEffect(() => {
    const key = currentEntry()?.key;
    if (key === undefined) return;
    const top = kept.get(key);
    if (top !== undefined) {
      window.scrollTo(0, top);
      // Again after the frame, past any restore the browser schedules for the traversal.
      requestAnimationFrame(() => window.scrollTo(0, top));
    }
    const note = () => kept.set(key, window.scrollY);
    document.addEventListener("click", note, true);
    return () => document.removeEventListener("click", note, true);
  }, []);
  return null;
}
