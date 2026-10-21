import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { DASH } from "@epl/core";
import type { PastSeason } from "@epl/core";
import CompareMap from "./CompareMap";
import Figures from "./Figures";
import PlayerMap from "./PlayerMap";
import { manIn, manOver, type Found } from "./overWindow";
import type { Played } from "./rates";

// The app's `@/` alias is Next's, not vitest's.
vi.mock("@/app/desk", () => import("../../desk"));
vi.mock("@/app/components/football/pitchBox", () => import("../../components/football/pitchBox"));
// The live season's files are not under test: a past side reads none of them.
vi.mock("../../intel", () => ({ heldShots: () => null, shotCover: () => null, intelShots: new Map(), intelTouches: new Map() }));
vi.mock("../../football", () => ({ seasonFixtures: async () => [] }));
vi.mock("../[fantraxId]/scouting", () => ({ gameLog: async () => null }));

const LINE: PastSeason = {
  season: "2024/25", minutes: 1800, goals: 10, assists: 4, cleanSheets: 2, goalsConceded: 20,
  yellowCards: 3, redCards: 0, saves: 0, fplPoints: 150,
};

const now: Played = {
  minutes: 900, starts: 10, expectedGoals: 4, nonPenaltyExpectedGoals: 3.2, expectedAssists: 1, tackles: 5, clearancesBlocksInterceptions: 3,
  recoveries: 20, saves: 0, expectedGoalsConceded: 9, touches: 400, shots: 20, keyPasses: 8,
  goals: 5, assists: 2, cleanSheets: 1, goalsConceded: 10,
};

/** Each ledger line's text, figure · label · figure. */
function ledger(html: string): string[] {
  return [...html.matchAll(/<tr[^>]*>(.*?)<\/tr>/g)].map((match) => match[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
}

describe("a past side on Compare", () => {
  it("keeps the ledger to what both seasons carry, and dashes a season with no map", () => {
    const past = manIn("Haaland 24/25", LINE, null);
    const html = renderToStaticMarkup(
      createElement(Figures, { a: now, b: past.played, names: { a: "Haaland 26/27", b: "Haaland 24/25" }, window: "in the seasons named", past: true }),
    );
    const lines = ledger(html);
    expect(lines.find((line) => line.includes("Touches/90"))).toBe(`40.00 Touches/90 ${DASH}`);
    expect(lines.find((line) => line.includes("Goals/90"))).toBe("0.50 Goals/90 0.50");
    expect(html).not.toContain("xG/90");
    expect(html).not.toContain("Starts");
  });

  it("sets this season's goals, assists and clean sheets against a past season's, per 90", async () => {
    const season = {
      goals: 6, assists: 3, cleanSheets: 1, minutes: 900, starts: 10, expectedGoals: 4, nonPenaltyExpectedGoals: 3.2, expectedAssists: 1,
      expectedGoalsConceded: 9, influence: 0, creativity: 0, threat: 0, tackles: 5, clearancesBlocksInterceptions: 3,
      recoveries: 20, saves: 0, goalsConceded: 12,
    };
    const side = { football: { player: { code: 1, season }, club: undefined } } as unknown as Found;
    const window = { inWindow: new Set<number>(), gameweekOf: new Map<number, number>() };
    const current = await manOver(side, "Haaland 26/27", { ...window, recent: false });
    const html = renderToStaticMarkup(
      createElement(Figures, {
        a: current.played,
        b: manIn("Haaland 24/25", LINE, null).played,
        names: { a: "Haaland 26/27", b: "Haaland 24/25" },
        window: "in the seasons named",
        past: true,
      }),
    );
    const lines = ledger(html);
    expect(lines.find((line) => line.includes("Goals/90"))).toBe("0.60 Goals/90 0.50");
    expect(lines.find((line) => line.includes("Assists/90"))).toBe("0.30 Assists/90 0.20");
    expect(lines.find((line) => line.includes("CS/90"))).toBe("0.10 CS/90 0.10");
    expect(lines.find((line) => line.includes("Conceded/90"))).toBe("1.20 Conceded/90 1.00");
    // A window of gameweeks carries no such counts: they are absent there, never nought.
    expect((await manOver(side, "Haaland", { ...window, recent: true })).played).toBeNull();
  });

  it("prints a dash, never a nought, over the shots of a season with no map", () => {
    const html = renderToStaticMarkup(
      createElement(CompareMap, {
        men: [
          { name: "Haaland 26/27", club: undefined, shots: [] },
          { name: "Haaland 24/25", club: undefined, shots: manIn("Haaland 24/25", LINE, null).shots },
        ],
        passes: false,
        window: "in the seasons named",
      }),
    );
    expect(html).toContain(`>${DASH}<`);
    expect(html).toContain("Haaland 24/25: no map of shots");
  });

  it("counts a past season's binned touches without inventing a match count", () => {
    const maps = { counts: new Map([[3, 250], [4, 150]]), shots: [] };
    const past = manIn("Haaland 24/25", LINE, maps);
    const html = renderToStaticMarkup(
      createElement(PlayerMap, { name: past.name, club: past.club, touches: past.heat ?? [], matches: past.matches, id: "b" }),
    );
    expect(html).toContain("400 touches<");
    expect(html).not.toContain("match");
  });
});
