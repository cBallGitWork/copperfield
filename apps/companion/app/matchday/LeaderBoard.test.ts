import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { FootballPlayer } from "@epl/core";
import LeaderBoard from "./LeaderBoard";
import { LISTS } from "./lists";
import { withWeeks } from "../components/football/withWeeks";

vi.mock("@/app/desk", () => import("../desk"));
vi.mock("@/app/components/shell/Link", () => ({ default: (props: object) => createElement("a", props) }));
vi.mock("next/image", () => ({ default: () => null }));

const neto = { code: 7, name: "Neto", fullName: "Pedro Lomba Neto", status: "d", chanceOfPlaying: 50, news: "Knock" } as unknown as FootballPlayer;
const html = renderToStaticMarkup(
  withWeeks(
    createElement(LeaderBoard, {
      list: LISTS[0],
      rows: [{ code: 7, name: "Neto", figure: 1.2, rank: 1, club: undefined, href: null, footballer: neto }],
    }),
  ),
);

describe("a Top stats list", () => {
  it("names a man by the one rule, his forename an initial under a thumb", () => {
    expect(html).toContain("P. Neto");
  });

  it("marks an unfit man with CM's mark and notes his complaint and chance", () => {
    expect(html).toContain('role="img"');
    expect(html).toContain(">Knock · 50%</span>");
  });
});
