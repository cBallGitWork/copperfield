"use client";

import { useEffect } from "react";
import { afterTap, tapReplaces, type Trail } from "./backStep";
import { plainClick } from "./plainClick";

// Remembers which page each in-app link was tapped from, for `BackPlate`; the browser's own history can lose it.

const TRAIL = "came-from";
/** The pages the plate has stepped from by the trail since the last tap, so it never walks a loop. */
const STEPPED = "came-from-stepped";

/** The URL the reader tapped this page from, or null when no tap of this session opened it. */
export function cameFrom(): string | null {
  return read<Trail>(TRAIL, {})[location.pathname] ?? null;
}

/** The pages the plate has left by the trail since the reader last tapped a link. */
export function steppedFrom(): string[] {
  return read<string[]>(STEPPED, []);
}

/** Notes that the plate is leaving this page by the trail. */
export function stepFrom(): void {
  write(STEPPED, [...steppedFrom(), location.pathname]);
}

/** Draws nothing: watches every same-origin link tap, before the link's own handler, and files it in the trail. */
export default function CameFrom() {
  useEffect(() => {
    const tap = (event: MouseEvent) => {
      if (!plainClick(event)) return;
      const link = (event.target as Element | null)?.closest?.("a[href]");
      if (!(link instanceof HTMLAnchorElement) || link.target === "_blank" || link.origin !== location.origin) return;
      const replace = tapReplaces(link.hasAttribute("data-replace"), history.state);
      write(TRAIL, afterTap(read<Trail>(TRAIL, {}), location.pathname + location.search, link.pathname + link.search, replace));
      write(STEPPED, []);
    };
    document.addEventListener("click", tap, true);
    return () => document.removeEventListener("click", tap, true);
  }, []);
  return null;
}

function read<T extends object>(key: string, empty: T): T {
  try {
    const held: unknown = JSON.parse(sessionStorage.getItem(key) ?? "null");
    return typeof held === "object" && held !== null && Array.isArray(held) === Array.isArray(empty) ? (held as T) : empty;
  } catch {
    return empty;
  }
}

function write(key: string, value: object): void {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage refused (a private window, a full quota): the plate falls back on the browser's history.
  }
}
