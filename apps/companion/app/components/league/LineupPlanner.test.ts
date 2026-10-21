import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { FootballPlayer, LeaguePlayerState, RosteredTeam, SquadPlayerDetail } from "@epl/core";
import LineupPlanner from "./LineupPlanner";
import SquadBoard from "./SquadBoard";
import TeamSheet from "./TeamSheet";

vi.mock("next/image", () => ({ default: () => null }));
vi.mock("@/app/desk", () => import("../../desk"));
vi.mock("@/app/components/shell/Link", () => ({ default: (props: object) => createElement("a", props) }));
vi.mock("@/app/squad/[teamId]/save", () => ({ saveLineup: async () => ({ ok: true }) }));
vi.mock("../../matchParts", () => ({ readMatchParts: () => new Promise(() => undefined) }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: () => undefined, push: () => undefined }) }));

// Craig, 21 Oct 2026: "my team is the one that's wrong" — his own list must look exactly like every rival's.

const man = (id: string, position: string, status: string): SquadPlayerDetail => ({
  rostered: { slot: { fantraxId: id, position, status }, player: { code: 1, name: id, fullName: id, status: "a", news: "" } as FootballPlayer, stats: [] },
  club: undefined,
  opposition: undefined,
  points: 4,
  minutes: [{ gameweek: 8, minutes: 80, asOf: "Thu 15 Oct" }] as SquadPlayerDetail["minutes"],
});

const keeper = man("Leno", "G", "ACTIVE");
const mid = man("Palmer", "M", "ACTIVE");
const sub = man("Kerkez", "D", "RESERVE");
const details = [keeper, mid, sub];
const team: RosteredTeam = { teamId: "t", teamName: "Mine", players: details.map((d) => d.rostered) };
const players: LeaguePlayerState[] = details.map((d) => ({ fantraxId: d.rostered.slot.fantraxId, eligiblePositions: [d.rostered.slot.position ?? ""], status: "" }));

const planner = renderToStaticMarkup(
  createElement(LineupPlanner, {
    team,
    details,
    players,
    limits: { maxTotalPlayers: 3, maxActivePlayers: 2, maxReservePlayers: 1, maxActiveByPosition: { G: 1, D: 1, M: 1 }, minActiveByPosition: {} },
    fantraxUrl: "https://example.test",
    pending: null,
    period: 8,
    benchRanks: {},
    canSave: false,
    picker: createElement("i", null, "WEEK"),
  }),
);
const gate = renderToStaticMarkup(
  createElement(SquadBoard, { lines: [{ position: "", players: details }], because: "not-locked", projected: false }),
);
const sheet = renderToStaticMarkup(
  createElement(TeamSheet, { rows: [{ position: "G", players: [keeper] }, { position: "M", players: [mid] }], bench: [sub], breakdown: {}, mode: "list" }),
);

const panels = (html: string) => html.match(/class="cm-panel\b[^"]*"/g) ?? [];
/** The list's head strip: everything from the Pos head to the first row. */
const headOf = (html: string) => html.slice(html.indexOf('<span class="w-10 shrink-0">'), html.indexOf('<ul class="cm-rows'));

describe("your own list is a rival's list", () => {
  it("draws one flush panel round list and pitch, never a box inside it", () => {
    expect(panels(planner)).toEqual(['class="cm-panel flex flex-col"']);
    expect(panels(gate)).toEqual(['class="cm-panel flex flex-col"']);
  });

  it("puts the bench under a plate in the same list, not in more boxes", () => {
    const list = planner.slice(planner.indexOf('<span class="w-10 shrink-0">'));
    expect(list.match(/>Bench</g)).toHaveLength(1);
    expect(planner.match(/<ul class="cm-rows/g)).toHaveLength(2);
    expect(planner.match(/<span class="w-10 shrink-0">/g)).toHaveLength(1);
    expect(sheet.match(/<span class="w-10 shrink-0">/g)).toHaveLength(1);
  });

  it("prints the same head as the rival's gate list, and the same row", () => {
    expect(headOf(planner)).toBe(headOf(gate));
    const rowOf = (html: string) => html.slice(html.indexOf("<li>"), html.indexOf("</li>"));
    expect(rowOf(planner)).toBe(rowOf(gate));
  });

  it("drops the lock plate (\"it hogs the page\")", () => {
    expect(planner).not.toContain("Locks");
  });
});

describe("the points head says whose points", () => {
  it("heads a season FPts and a gameweek GW", () => {
    expect(headOf(gate)).toContain('title="Points this season">FPts<');
    expect(headOf(planner)).toContain('title="Points this season">FPts<');
    expect(headOf(sheet)).toContain('title="Points this gameweek">GW<');
  });
});

describe("the head strip", () => {
  it("butts its figure plates, as every table's head does", () => {
    const figures = headOf(gate).match(/<span class="(flex shrink-0 items-center)">/);
    expect(figures?.[1]).not.toMatch(/\bgap-/);
  });
});
