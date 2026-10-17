"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Glyph from "./glyphs";
import { armed, holdsNative, intent, pullDistance } from "./pull";
import { reloadsHeld } from "./unsaved";
import { reloadIfBehind } from "./newerBuild";
import { PULL } from "../../config";

// Pull down from the top of a page to refresh it, as a browser's own pull does, in the installed app only: a browser
// tab has its own, and the home-screen app (`display: standalone`) has none.

/** The longest the plate turns for one refresh, should neither the transition nor the page say it has landed. */
const TURN_CAP_MS = 2500;
/** The shortest, so a refresh that lands at once still reads as having happened. */
const TURN_MIN_MS = 400;

/** Whether the app was opened from the home screen: iOS says so on `navigator`, everything else by media query. */
function installed(): boolean {
  return matchMedia("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone === true;
}

/** Whether a touch here belongs to something that scrolls on its own: a dialog, or a scrolled sheet or panel. */
function ownScroll(target: EventTarget | null): boolean {
  if (document.querySelector("dialog[open]") !== null) return true;
  for (let node = target instanceof Element ? target : null; node !== null; node = node.parentElement) {
    if (node.scrollTop > 0) return true;
  }
  return false;
}

/** The plate at `value` px down, straight onto its style rather than through a render, so it keeps up with the finger. */
function paint(node: HTMLDivElement | null, value: number): void {
  if (node === null) return;
  node.style.setProperty("--pull", `${value}px`);
  node.style.setProperty("--turn", `${(value / PULL.arm) * 270}deg`);
  node.style.visibility = value === 0 ? "hidden" : "visible";
}

export default function PullToRefresh() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [turning, setTurning] = useState(false);
  const [ready, setReady] = useState(false);
  const plate = useRef<HTMLDivElement>(null);
  const released = useRef(0);

  useEffect(() => {
    if (!installed()) return;
    let start: { x: number; y: number } | null = null;
    let read: "pull" | "other" | null = null;
    let pulled = 0;
    let frame = 0;
    const show = (value: number) => {
      pulled = value;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => paint(plate.current, value));
      setReady(armed(value, PULL));
    };
    const begin = (event: TouchEvent) => {
      const touch = event.touches[0];
      const free = event.touches.length === 1 && window.scrollY <= 0 && !ownScroll(event.target) && !reloadsHeld();
      start = free ? { x: touch.clientX, y: touch.clientY } : null;
      read = null;
    };
    const move = (event: TouchEvent) => {
      if (start === null) return;
      const touch = event.touches[0];
      const dx = touch.clientX - start.x;
      const dy = touch.clientY - start.y;
      // Down from the top: hold the bounce from the first move, so iOS never drags the page under the plate.
      if (holdsNative(dx, dy) && event.cancelable) event.preventDefault();
      read ??= intent(dx, dy, PULL);
      // A sideways swipe, or a page that has started to scroll, lets the gesture go for good.
      if (read === "other" || window.scrollY > 0) {
        start = null;
        return show(0);
      }
      show(pullDistance(dy, PULL));
    };
    const end = () => {
      const refresh = start !== null && armed(pulled, PULL);
      start = null;
      if (!refresh) return show(0);
      // Held at the arm distance, turning, until the refresh lands.
      cancelAnimationFrame(frame);
      paint(plate.current, PULL.arm);
      released.current = Date.now();
      setTurning(true);
      // Onto the live deployment when this page is behind it; otherwise its own build answers the refresh.
      void reloadIfBehind(true).then((reloaded) => {
        if (!reloaded) startTransition(() => router.refresh());
      });
    };
    const cancel = () => {
      start = null;
      show(0);
    };
    window.addEventListener("touchstart", begin, { passive: true });
    // Not passive: a passive listener cannot hold the native bounce.
    window.addEventListener("touchmove", move, { passive: false });
    window.addEventListener("touchend", end);
    window.addEventListener("touchcancel", cancel);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("touchstart", begin);
      window.removeEventListener("touchmove", move);
      window.removeEventListener("touchend", end);
      window.removeEventListener("touchcancel", cancel);
    };
  }, [router]);

  // Turning from the release until the refresh lands, for at least `TURN_MIN_MS` and at most `TURN_CAP_MS`.
  useEffect(() => {
    if (!turning) return;
    const node = plate.current;
    const stop = () => {
      setTurning(false);
      setReady(false);
      paint(node, 0);
    };
    let landed: ReturnType<typeof setTimeout> | undefined;
    const settle = () => {
      landed ??= setTimeout(stop, Math.max(0, released.current + TURN_MIN_MS - Date.now()));
    };
    const cap = setTimeout(stop, Math.max(0, released.current + TURN_CAP_MS - Date.now()));
    if (!pending) settle();
    // The refreshed page changing the DOM is the landing too: on `/` and Live the transition never says so.
    const watch = new MutationObserver((records) => {
      if (records.some((record) => !node?.contains(record.target))) settle();
    });
    watch.observe(document.body, { subtree: true, childList: true, characterData: true });
    return () => {
      clearTimeout(cap);
      clearTimeout(landed);
      watch.disconnect();
    };
  }, [turning, pending]);

  return (
    <div ref={plate} aria-hidden className="cm-pull" data-refreshing={turning || undefined} style={{ visibility: "hidden" }}>
      {/* Raised while it would do nothing, pressed once letting go refreshes: DESIGN §2's plate grammar. */}
      <span className={`${ready || turning ? "cm-bevel-pressed" : "cm-bevel"} flex min-h-11 items-center gap-2 px-3`}>
        <Glyph name="refresh" />
        <span className="whitespace-nowrap text-xs font-semibold leading-4">
          {turning ? "Refreshing" : ready ? "Release to refresh" : "Pull to refresh"}
        </span>
      </span>
    </div>
  );
}
