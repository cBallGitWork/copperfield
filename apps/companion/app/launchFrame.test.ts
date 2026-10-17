import { describe, expect, it } from "vitest";
import { LAUNCH_FRAME, LAUNCH_STAMP, launchExit, launchShownAt, launchSize } from "./launchFrame";

/** Runs the inline script against a page that is, or is not, the installed app, and returns `<html>`'s stamp. */
function stamp(page: { displayMode: boolean; standalone?: boolean; now?: number }): string | undefined {
  const dataset: Record<string, string> = {};
  const run = new Function("matchMedia", "navigator", "document", "performance", LAUNCH_STAMP);
  run(
    (query: string) => ({ matches: page.displayMode && query === "(display-mode: standalone)" }),
    { standalone: page.standalone },
    { documentElement: { dataset } },
    { now: () => page.now ?? 0 },
  );
  return dataset.launch;
}

describe("whether the launch frame shows", () => {
  it("shows in the installed app, by display mode or by iOS's own flag", () => {
    expect(stamp({ displayMode: true, now: 312.5 })).toBe("312.5");
    expect(stamp({ displayMode: false, standalone: true, now: 90 })).toBe("90");
  });

  it("never shows in a browser tab", () => {
    expect(stamp({ displayMode: false })).toBeUndefined();
    expect(stamp({ displayMode: false, standalone: false })).toBeUndefined();
  });

  it("reads the stamp back, and no stamp as never shown", () => {
    expect(launchShownAt("312.5")).toBe(312.5);
    expect(launchShownAt(undefined)).toBeNull();
    expect(launchShownAt("")).toBeNull();
    expect(launchShownAt("soon")).toBeNull();
  });
});

describe("when the launch frame leaves", () => {
  const { minimum, fade } = LAUNCH_FRAME;

  it("stays its minimum from its first paint when the app hydrates quickly", () => {
    expect(launchExit(100, 400, false)).toEqual({ leave: minimum - 300, gone: minimum - 300 + fade });
  });

  it("leaves at once when hydration came after the minimum", () => {
    expect(launchExit(100, 100 + minimum + 900, false)).toEqual({ leave: 0, gone: fade });
  });

  it("leaves without a fade under reduced motion", () => {
    expect(launchExit(0, 0, true)).toEqual({ leave: minimum, gone: minimum });
  });

  it("is taken out at once where it never showed", () => {
    expect(launchExit(null, 5000, false)).toEqual({ leave: 0, gone: 0 });
  });

  it("is a loading screen, not a flicker, and the stall fallback outlasts it", () => {
    expect(minimum).toBeGreaterThanOrEqual(1000);
    expect(LAUNCH_FRAME.stall).toBeGreaterThan(minimum + fade);
  });
});

describe("the launch frame's size", () => {
  it("is a 390-point phone's points on every phone, and fits the shortest one tall-ways", () => {
    expect(launchSize()).toBe("min(calc(100vw / 390), calc(100svh / 693.7))");
  });
});
