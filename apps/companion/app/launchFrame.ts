import { DESIGN_WIDTH } from "./launchLayout";
import { LAUNCH_SCREENS } from "./launchScreens";

// The installed app's own launch frame: CM's loading screen over the first paint of every full load, since iOS draws
// its launch image only while the app's process starts (DESIGN §2).

/** Milliseconds: up at least `minimum` from its first paint, then a `fade`; CSS takes it down at `stall` regardless. */
export const LAUNCH_FRAME = { minimum: 1200, fade: 200, stall: 5000 } as const;

/** Inline, before the frame parses: stamps `<html data-launch>` with the time, in the installed app only. */
export const LAUNCH_STAMP =
  'if(matchMedia("(display-mode: standalone)").matches||navigator.standalone===true)' +
  "document.documentElement.dataset.launch=String(performance.now())";

/** When the stamp says the frame first showed, or null when it never did. */
export function launchShownAt(stamp: string | undefined): number | null {
  const shown = stamp ? Number(stamp) : NaN;
  return Number.isFinite(shown) ? shown : null;
}

/** From hydration at `now`: when the frame starts to fade, and when it leaves the tree. */
export function launchExit(shownAt: number | null, now: number, reducedMotion: boolean): { leave: number; gone: number } {
  if (shownAt === null) return { leave: 0, gone: 0 };
  const leave = Math.max(0, shownAt + LAUNCH_FRAME.minimum - now);
  return { leave, gone: leave + (reducedMotion ? 0 : LAUNCH_FRAME.fade) };
}

/** One of a 390-point phone's points, so the frame draws as the launch images do, kept short enough for the SE. */
export function launchSize(): string {
  const stubbiest = Math.min(...LAUNCH_SCREENS.map((screen) => screen.height / screen.width));
  return `min(calc(100vw / ${DESIGN_WIDTH}), calc(100svh / ${(DESIGN_WIDTH * stubbiest).toFixed(1)}))`;
}
