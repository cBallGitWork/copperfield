import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import PhotoGround from "./PhotoGround";

vi.mock("next/navigation", () => ({ usePathname: () => "/league" }));

/** The ground's `sizes`, and whether it is asked for at low priority. */
function ground(): { sizes: string | null; low: boolean } {
  const html = renderToStaticMarkup(createElement(PhotoGround, {}));
  return { sizes: /sizes="([^"]+)"/.exec(html)?.[1] ?? null, low: /fetchPriority="low"/i.test(html) };
}

describe("the desk's ground", () => {
  // 16 Oct 2026: w=1200 (186 KB) to a 390 phone and w=1920 (460 KB) at 1440, preloaded on every desk page.
  it("asks for half the screen's pixels on a phone and three quarters on the desk, darkened as it is", () => {
    expect(ground().sizes).toBe("(min-width: 64rem) 75vw, 50vw");
  });

  it("waits behind what the page draws: no preload, low priority", () => {
    expect(ground().low).toBe(true);
  });
});
