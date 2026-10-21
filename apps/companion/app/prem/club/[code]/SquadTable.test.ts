import { createElement, Fragment, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import SquadTable, { type SquadMinutes } from "./SquadTable";

vi.mock("@/app/desk", () => import("../../../desk"));
vi.mock("@/app/components/shell/Absent", () => import("../../../components/shell/Absent"));
vi.mock("@/app/components/shell/Link", () => ({ default: (props: object) => createElement("a", props) }));
vi.mock("../../../components/league/ScrollBoard", () => ({
  default: ({ children }: { children: ReactNode }) => createElement(Fragment, null, children),
}));

const render = (minutes: SquadMinutes | null) =>
  renderToStaticMarkup(createElement(SquadTable, { players: [], league: new Map(), reader: null, cards: new Map(), minutes }));

describe("a club's squad", () => {
  // Review: the xMins column printed no date, where the player page and a squad say "xMins as of".
  it("dates its xMins once, under the table", () => {
    const html = render({ gameweek: 8, byCode: new Map(), asOf: "Thu 15 Oct" });
    expect(html.match(/xMins as of Thu 15 Oct/g)).toHaveLength(1);
  });

  it("prints no date with no xMins column", () => {
    expect(render(null)).not.toContain("as of");
  });
});
