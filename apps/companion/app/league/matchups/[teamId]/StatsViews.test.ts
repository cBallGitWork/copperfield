import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { LeagueTeam } from "@epl/core";
import StatsViews from "./StatsViews";

vi.mock("next/navigation", () => ({ usePathname: () => "/league/matchups/a" }));
vi.mock("@/app/components/shell/Link", () => ({ default: (props: object) => createElement("a", props) }));
vi.mock("@/app/desk", () => import("../../../desk"));

const team = (teamId: string, name: string) => ({ teamId, name }) as LeagueTeam;
const html = renderToStaticMarkup(
  createElement(StatsViews, {
    teams: [team("uexqrijomu8l5asi", "AtleticoTimHortons"), team("ipnp5y4mmu9j7kop", "Hazza Maguazza's Redempshazza")],
    current: "fantasy",
    teamId: "uexqrijomu8l5asi",
    gameweek: 6,
    vs: undefined,
  }),
);

describe("the head-to-head's Stats views", () => {
  it("names each side by its short name, then Fantasy", () => {
    expect([...html.matchAll(/<a [^>]*>([^<]*)</g)].map((match) => match[1])).toEqual(["Atletico", "Hazza", "Fantasy"]);
  });
});
