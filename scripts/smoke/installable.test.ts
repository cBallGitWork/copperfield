import { describe, expect, it } from "vitest";
import { launchScreenProblems } from "./installable";

const LINK = '<link href="/launch/1170x2532" media="(device-width: 390px)" rel="apple-touch-startup-image"/>';
const CAPABLE = '<meta name="apple-mobile-web-app-capable" content="yes"/>';

describe("launchScreenProblems", () => {
  it("passes a head with the startup images and Apple's capable tag", () => {
    expect(launchScreenProblems(`${CAPABLE}${LINK}${LINK}`)).toEqual([]);
  });

  it("fails the head production served on 12 Oct: eleven images and only the generic tag", () => {
    const head = `<meta name="mobile-web-app-capable" content="yes"/>${LINK.repeat(11)}`;
    expect(launchScreenProblems(head)).toEqual([
      "11 startup images but no apple-mobile-web-app-capable meta, so an iPhone ignores them",
    ]);
  });

  it("fails a head with no startup image at all", () => {
    expect(launchScreenProblems(CAPABLE)).toEqual([
      "no apple-touch-startup-image link, so an installed iPhone draws no launch screen",
    ]);
  });
});
