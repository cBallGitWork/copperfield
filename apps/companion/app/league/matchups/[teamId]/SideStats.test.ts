import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { FootballPlayer, LeagueTeam, LineupDetail, SquadPlayerDetail } from "@epl/core";
import SideStats from "./SideStats";
import { withWeeks } from "../../../components/football/withWeeks";

vi.mock("@/app/desk", () => import("../../../desk"));
vi.mock("@/app/components/shell/Link", () => ({ default: (props: object) => createElement("a", props) }));
vi.mock("next/image", () => ({ default: () => null }));
vi.mock("@/app/teamColours", () => import("../../../teamColours"));
vi.mock("@/app/components/shell/Absent", () => import("../../../components/shell/Absent"));

const man = (fantraxId: string, name: string, status: string, chanceOfPlaying: number | null, points: number): SquadPlayerDetail => ({
  rostered: {
    slot: { fantraxId, position: "D", status: "" },
    player: { code: 1, name, fullName: `William ${name}`, status, chanceOfPlaying, news: status === "a" ? "" : "Knee" } as unknown as FootballPlayer,
    stats: [],
  },
  club: undefined,
  opposition: [],
  points,
  minutes: [],
});

const sheet: LineupDetail = {
  rows: [{ players: [man("a", "Fit", "a", 100, 6)] }] as unknown as LineupDetail["rows"],
  bench: [man("b", "Saliba", "i", 0, 0)],
  shape: "1-0-0-0",
};

const html = renderToStaticMarkup(withWeeks(
  createElement(SideStats, {
    team: { teamId: "t1", name: "Side" } as LeagueTeam,
    sheet,
    columns: [{ code: "G", name: "Goals", longCode: null }],
    counts: { a: { G: "1" }, b: {} },
    breakdown: { a: [{ code: "G", points: 4 }] } as never,
    sort: { head: "Pts", descending: true },
    hrefFor: (head: string) => `?sort=${head}`,
  }),
));

describe("Matchup Stats board", () => {
  it("marks and washes an unfit man, on the bench too", () => {
    expect(html.match(/role="img"/g)?.length).toBe(1);
    expect(html).toContain("cm-doubt-out");
    expect(html).not.toContain("cm-state");
    expect(html.match(/>Knee · GW10<\/span>/g)?.length).toBe(1);
  });

  it("heads Fantrax's points FPts and inks them cyan, never by gain or loss", () => {
    expect(html).toContain(">FPts<");
    const six = html.match(/<td[^>]*class="([^"]*)"[^>]*>6<\/td>/)?.[1] ?? "";
    expect(six).toContain("text-info");
    expect(six).not.toMatch(/text-up|text-bad/);
  });

  it("keeps gain and loss on the category columns", () => {
    expect(html).toMatch(/<td[^>]*class="[^"]*text-up[^"]*"[^>]*>1<\/td>/);
  });

  it("names a man I. Surname under a thumb", () => {
    expect(html).toContain("W. Saliba");
  });
});
