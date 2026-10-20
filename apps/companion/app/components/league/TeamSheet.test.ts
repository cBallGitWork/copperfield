import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { FootballPlayer, LineupDetail, SquadPlayerDetail } from "@epl/core";
import TeamSheet from "./TeamSheet";
import { autoSubbed } from "./autoSubbed";

vi.mock("next/image", () => ({ default: () => null }));
vi.mock("@/app/desk", async () => await import("../../desk"));
vi.mock("@/app/components/shell/Link", () => ({ default: (props: object) => createElement("a", props) }));
vi.mock("../../matchParts", () => ({ readMatchParts: () => new Promise(() => undefined) }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: () => undefined }) }));

const man = (name: string, position: string, points: number | null): SquadPlayerDetail => ({
  rostered: { slot: { fantraxId: name, position, status: "" }, player: { code: 1, name, fullName: name, status: "a", news: "" } as FootballPlayer, stats: [] },
  club: undefined,
  opposition: undefined,
  points,
  minutes: [],
});

// Craig, 19 Oct 2026: "on the live head to head we show an auto subbed icon? then sarr (my sub) goes to the back of
// the bench, no number assigned to him, make it clear its auto sub".
const gw7: LineupDetail = {
  rows: [{ position: "G", players: [man("Leno", "G", 6)] }, { position: "M", players: [man("Sarr", "M", null), man("Palmer", "M", 2)] }],
  bench: [man("Kerkez", "D", 3), man("Hinshelwood", "M", 6), man("Khalaili", "D", 1)],
  shape: "1-2",
};
const { sheet, marks } = autoSubbed(gw7, [{ off: "Sarr", on: "Kerkez", provisional: false }]);
const pitch = renderToStaticMarkup(createElement(TeamSheet, { rows: sheet.rows, bench: sheet.bench, breakdown: {}, mode: "pitch", autoSubs: marks }));
const [grass = "", strip = ""] = pitch.split('aria-label="Bench"');

describe("an auto sub on the match-up pitch", () => {
  it("stands Kerkez in Sarr's slot with the auto-sub mark and his points", () => {
    expect(grass).toContain('title="Auto-sub: on for Sarr, who did not play."');
    expect(grass).toContain('aria-label="Kerkez"');
    expect(grass).not.toContain('aria-label="Sarr"');
  });

  it("puts Sarr at the end of the bench with no number, under the word", () => {
    const order = [...strip.matchAll(/aria-label="([^"]+)"/g)].map((m) => m[1]);
    expect(order).toEqual(["Hinshelwood", "Khalaili", "Sarr"]);
    expect([...strip.matchAll(/cm-index[^>]*>(\d+)</g)].map((m) => m[1])).toEqual(["1", "2"]);
    expect(strip.slice(strip.lastIndexOf("Auto-sub"), strip.indexOf('aria-label="Sarr"'))).not.toMatch(/cm-index/);
  });

  it("marks nobody when there is no sub", () => {
    const plain = renderToStaticMarkup(createElement(TeamSheet, { rows: gw7.rows, bench: gw7.bench, breakdown: {}, mode: "pitch" }));
    expect(plain).not.toContain("Auto-sub");
  });
});
