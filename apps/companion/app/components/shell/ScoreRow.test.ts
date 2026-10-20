import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import ScoreRow from "./ScoreRow";
import { tieSide } from "../league/tieSide";

vi.mock("@/app/components/shell/Link", () => ({ default: (props: object) => createElement("a", props) }));
vi.mock("@/app/desk", () => ({ INDEX_WIDTH: "", ROW_NAME: "" }));
vi.mock("@/app/mine", () => import("../../mine"));

const places = new Map<string, string>();
const seat = (teamId: string, label: string) => ({ team: { teamId }, label });

describe("a fantasy tie's results row", () => {
  // Review M2: nothing on Live said who still had men to play.
  it("prints each side's men still to play under its name", () => {
    const html = renderToStaticMarkup(
      createElement(ScoreRow, {
        home: tieSide(seat("a", "Home"), places, null, { left: "2 to play" }),
        away: tieSide(seat("b", "Away"), places, null, { left: "all played" }),
        score: { home: 30, away: 41 },
      }),
    );
    expect(html).toMatch(/Home[\s\S]*2 to play[\s\S]*Away[\s\S]*all played/);
  });

  it("prints nothing under a name with nothing to say", () => {
    const html = renderToStaticMarkup(
      createElement(ScoreRow, { home: tieSide(seat("a", "Home"), places, null), away: tieSide(seat("b", "Away"), places, null), score: null }),
    );
    expect(html).not.toContain("to play");
    expect(html).not.toContain("played");
  });
});

// Review LEAGUE-2: the reader's row stepped 4px right of the column, its accent edge the only border on the list.
describe("the reader's row in a column of rows", () => {
  const row = (mine: boolean) =>
    renderToStaticMarkup(createElement(ScoreRow, { home: { name: "Home", mine }, away: { name: "Away" }, score: null }));

  it("gives every row the same 4px left edge, so names and scores keep one column", () => {
    expect(row(true)).toContain("border-l-4 border-l-accent");
    expect(row(false)).toContain("border-l-4 border-l-transparent");
  });
});
