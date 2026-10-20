import { createElement, Fragment, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

const { pass } = vi.hoisted(() => ({ pass: ({ children }: { children: ReactNode }) => createElement(Fragment, null, children) }));
vi.mock("../../round", () => ({ leagueInfo: async () => ({ teams: [{ teamId: "t1", name: "The Raccoons" }] }) }));
vi.mock("../../business", () => ({
  readDeals: async () => ({
    whole: true,
    rows: [
      { setId: "s1", kind: "claim", fantraxId: "p1", playerName: "Kevin Schade", position: "F", club: "BRE", clubName: "Brentford", via: "waivers", fromTeamId: null, toTeamId: "t1", processedAt: "Wed Oct 14, 2026, 9:14AM", period: 8, executed: true },
    ],
  }),
}));
vi.mock("../Shell", () => ({ default: pass }));
vi.mock("../../components/league/ScrollBoard", () => ({ default: pass }));
vi.mock("next/image", () => ({ default: (props: object) => createElement("img", props) }));
vi.mock("@/app/desk", () => import("../../desk"));
vi.mock("@/app/components/shell/Link", () => ({ default: (props: object) => createElement("a", props) }));
vi.mock("@/app/teamColours", () => import("../../teamColours"));
vi.mock("@/app/teamNames", () => import("../../teamNames"));
vi.mock("@/app/players/routes", () => import("../../players/routes"));

import TransfersPage from "./page";

describe("the league's transfers", () => {
  it("names the mover while rosters are refused, since the names are the league's and not the rosters'", async () => {
    const html = renderToStaticMarkup(await TransfersPage());
    expect(html).toContain("Kevin Schade");
    expect(html).toContain("The Raccoons");
  });
});
