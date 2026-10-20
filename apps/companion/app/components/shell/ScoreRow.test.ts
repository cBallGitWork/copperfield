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

  // Review LEAGUE-8: Matchups, now retired into Fixtures, was the only screen with the clean sheets owed.
  it("prints the clean sheets Fantrax has not credited beside the men still to play", () => {
    const html = renderToStaticMarkup(
      createElement(ScoreRow, {
        home: tieSide(seat("a", "Home"), places, null, { left: "2 to play", pending: 4 }),
        away: tieSide(seat("b", "Away"), places, null, { pending: 6 }),
        score: { home: 30, away: 41 },
      }),
    );
    expect(html).toMatch(/Home[\s\S]*2 to play[\s\S]*\+4[\s\S]*Away[\s\S]*\+6/);
  });

  it("prints no clean sheets for a side owed none", () => {
    const html = renderToStaticMarkup(
      createElement(ScoreRow, {
        home: tieSide(seat("a", "Home"), places, null, { pending: 0 }),
        away: tieSide(seat("b", "Away"), places, null, { pending: null }),
        score: { home: 30, away: 41 },
      }),
    );
    expect(html).not.toContain("+");
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
  const row = (mine: boolean, marks?: boolean) =>
    renderToStaticMarkup(createElement(ScoreRow, { home: { name: "Home", mine }, away: { name: "Away" }, score: null, marks }));

  it("gives every row of a fantasy list the same 4px left edge, so names and scores keep one column", () => {
    expect(row(true, true)).toContain("border-l-4 border-l-accent");
    expect(row(false, true)).toContain("border-l-4 border-l-transparent");
  });

  // Review: the transparent edge sat every football row 4px in on Prem, Live and the matchup's Fixtures tab.
  it("leaves a football row, which is never the reader's, flush at both ends", () => {
    expect(row(false)).not.toContain("border-l-4");
  });
});
