import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { LeagueTeam } from "@epl/core";
import MatchupBoard, { type MatchupSide } from "./MatchupBoard";
import shortNames from "../../../../../data/leagues/short-names.json";

vi.mock("next/navigation", () => ({ useRouter: () => ({}) }));
vi.mock("@/app/components/shell/Link", () => ({ default: (props: object) => createElement("a", props) }));
vi.mock("@/app/desk", () => import("../../desk"));
vi.mock("@/app/mine", () => ({ yoursMark: () => "" }));
vi.mock("@/app/teamColours", () => ({ teamColours: () => ({ primary: "#123456", secondary: "#ffffff" }) }));
vi.mock("@/app/teamNames", async () => await import("../../teamNames"));

const side = (teamId: string, name: string, points: number, line: string | null = null): MatchupSide => ({
  team: { teamId, name } as LeagueTeam,
  score: { teamId, points, toPlay: null },
  mine: false,
  line,
  lineup: null,
});

const board = (a: MatchupSide, b: MatchupSide) =>
  renderToStaticMarkup(createElement(MatchupBoard, { team: a, opponent: b, view: "lineups", tabs: [{ key: "lineups", label: "Lineups", href: "#" }], body: null, back: "/league/fixtures?gw=6" }));

describe("the head-to-head's scoreline on a phone", () => {
  // Craig, 29 Oct 2026: the scoreline is this screen's title bar, so it stays put with its way back.
  it("locks to the top, back plate and all", () => {
    expect(board(side("a", "A", 1), side("b", "B", 0))).toMatch(/^<div[^>]*><div class="max-lg:sticky [^"]*"><header class="flex items-stretch"><button[^>]*aria-label="Back"/);
  });

  // Craig, 11 Oct 2026: "THE TRUF…" and "COWTHE…" at 390.
  it("names each side by the league's short name under a thumb, and in full on the desk", () => {
    const html = board(side("aekx2715mtzgcl3f", "The Truffle Pigs", 15), side("7z8fy0pnmuogbtdw", "Cowthenbeef", 12));
    expect(html).toContain('<span class="lg:hidden">Truffles</span>');
    expect(html).toContain('<span class="lg:hidden">Beef</span>');
    expect(html).toContain('<span class="hidden lg:inline">The Truffle Pigs</span>');
  });

  it("has a short name that fits its half at 390: nine capitals at most", () => {
    // A half at 390 is 161px; the score's plate takes 56 and the name's padding 16, which leaves 89 for nine
    // capitals of Oxanium bold at 14px (GLENGARRY measures 82).
    const longest = Math.max(...Object.values(shortNames.shortNames).map((entry) => entry.short.length));
    expect(longest).toBeLessThanOrEqual(9);
  });

  it("sets the phone's name a step down from the desk's, so nine capitals fit", () => {
    const html = board(side("syjkob6cmuobagfu", "GlengarryHearts", 1), side("7z8fy0pnmuogbtdw", "Cowthenbeef", 2));
    expect(html).toMatch(/class="[^"]*\btext-sm\b[^"]*lg:text-2xl[^"]*"/);
  });
});

describe("the line under each name", () => {
  // Review M2: nothing on the board said who still had men to play.
  it("prints each side's own line under its name", () => {
    const html = board(side("aekx2715mtzgcl3f", "The Truffle Pigs", 15, "2 to play"), side("7z8fy0pnmuogbtdw", "Cowthenbeef", 12, "all played"));
    expect(html).toMatch(/Truffles[\s\S]*2 to play[\s\S]*Beef[\s\S]*all played/);
  });

  it("prints no line for a side with nothing to say", () => {
    const html = board(side("aekx2715mtzgcl3f", "The Truffle Pigs", 15), side("7z8fy0pnmuogbtdw", "Cowthenbeef", 12));
    expect(html).not.toMatch(/to play|played/);
  });
});

describe("the scoreline's halves", () => {
  // Review M-LEAGUE-4: on Stats the halves claimed a side was open while the foot row named the other.
  const tabs = [
    { key: "lineups", label: "Lineups", href: "#" },
    { key: "stats", label: "Stats", href: "#" },
  ];
  const on = (view: string) =>
    renderToStaticMarkup(
      createElement(MatchupBoard, {
        team: side("aekx2715mtzgcl3f", "The Truffle Pigs", 15),
        opponent: side("7z8fy0pnmuogbtdw", "Cowthenbeef", 12),
        view,
        tabs,
        body: null,
        back: "/league/fixtures?gw=6",
      }),
    );

  it("open a side on Line-ups, the open one barred", () => {
    const html = on("lineups");
    expect(html.match(/<button type="button" aria-pressed/g)).toHaveLength(2);
    expect(html).toContain('aria-pressed="true"');
    expect(html).toContain("bg-accent");
  });

  it("are captions on every other view: no control, no pressed state, no bar", () => {
    const html = on("stats");
    expect(html).not.toContain('aria-label="Show');
    expect(html).not.toContain("aria-pressed");
    expect(html).not.toContain("bg-accent");
    expect(html).toMatch(/Truffles[\s\S]*Beef/);
  });
});
