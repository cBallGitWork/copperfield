import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { FootballPlayer, SquadPlayerDetail } from "@epl/core";
import { SquadList } from "./sides";

vi.mock("next/image", () => ({ default: () => null }));
vi.mock("@/app/desk", () => import("../../../desk"));
vi.mock("@/app/components/shell/Link", () => ({ default: (props: object) => createElement("a", props) }));
vi.mock("@/app/squad/routes", () => import("../../../squad/routes"));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: () => undefined }) }));

const man: SquadPlayerDetail = {
  rostered: { slot: { fantraxId: "a", position: "M", status: "" }, player: { code: 1, name: "Rice", fullName: "Declan Rice", status: "a", news: "" } as FootballPlayer, stats: [] },
  club: undefined,
  opposition: undefined,
  points: undefined,
  minutes: [],
};

describe("a rival's unarranged side before kickoff", () => {
  // Lane 1 review: every squad list opens the player card on a tap; this one printed dead rows.
  it("opens his card on a tap, in one flush panel, as every squad list does", () => {
    const html = renderToStaticMarkup(createElement(SquadList, { listed: { lines: [{ position: "M", players: [man] }] }, teamId: "t" }));
    expect(html).toMatch(/<button type="button" class="cm-row/);
    expect(html.match(/class="cm-panel\b/g)).toHaveLength(1);
  });
});
