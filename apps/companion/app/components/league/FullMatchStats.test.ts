import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { MatchParts } from "@epl/core";
import { MatchFigures, settled } from "./FullMatchStats";

vi.mock("@/app/desk", async () => await import("../../desk"));
vi.mock("../../matchParts", () => ({ readMatchParts: () => new Promise(() => undefined) }));

const parts: MatchParts = {
  tacklesWon: 3, interceptions: 1, blocks: 1, clearances: 1, recoveries: 11, penaltiesWon: 1,
  smothers: 0, punches: 0, highClaims: 0, saves: 0, shots: 3, shotsOnTarget: 1, chancesCreated: 2,
  bigChancesCreated: 1, bigChancesMissed: 0, crosses: 3, accurateCrosses: 2, touchesInBox: 4,
  contests: 2, contestsWon: 1, aerialsWon: 4,
};

const figures = (read: Parameters<typeof MatchFigures>[0]["read"], position = "D") =>
  renderToStaticMarkup(createElement(MatchFigures, { read, position }));

// Craig, 11 Oct 2026: "Why wouldn't the player card in live games just use Fantrax data?" FPL 403'd mid-match.
describe("a live man's full match stats, with Fantrax and Opta and no FPL", () => {
  const html = figures({ parts, scored: ["penaltiesWon"] });

  it("draws Opta's priced part, his attacking and his defending", () => {
    expect(html).toContain("Penalties won");
    expect(html).toContain("Attacking");
    expect(html).toContain("Shots on target");
    expect(html).toContain("Defensive");
    expect(html).toContain("Tackles won");
  });

  it("draws nothing Fantrax counts above it", () => {
    for (const fantrax of ["Minutes", "Goals", "Assists", "Yellow cards", "DefCon", "Clean sheets"]) {
      expect(html).not.toContain(`>${fantrax}<`);
    }
  });

  it("says so when Opta has no line for him, rather than an empty drop-down", () => {
    expect(figures({ parts: null, scored: ["penaltiesWon"] })).toContain("No match figures for him yet.");
  });

  it("drops the yet once his match is over", () => {
    const over = renderToStaticMarkup(createElement(MatchFigures, { read: { parts: null, scored: [] }, position: "D", over: true }));
    expect(over).toContain("No match figures for him.");
  });

  // Craig, 19 Oct 2026: "just an empty card". An open panel with nothing under it read as broken.
  it("says it is getting them while the read is out", () => {
    expect(figures(null)).toContain("Getting his match figures");
  });

  it("says it could not get them, with a way to try again, when the read failed", () => {
    const html = renderToStaticMarkup(createElement(MatchFigures, { read: "failed", position: "D", onRetry: () => undefined }));
    expect(html).toContain("No match figures right now.");
    expect(html).toMatch(/<button[^>]*>Try again<\/button>/);
    expect(html).not.toContain("No match figures for him");
    // Amber is a figure beside a name (DESIGN §3); a sentence is muted, beside the accent's Try again.
    expect(html).toContain("text-muted");
    expect(html).not.toContain("text-mid");
  });
});

// A rejected action (a timeout, a deploy's old action id) and an empty answer are failures, never "no figures".
describe("a match read as it comes back", () => {
  it("is failed when the answer is missing", () => {
    expect(settled(null)).toBe("failed");
    expect(settled(undefined)).toBe("failed");
  });

  it("is the answer when there is one, an empty one included", () => {
    expect(settled({ parts: null, scored: [] })).toEqual({ parts: null, scored: [] });
  });
});
