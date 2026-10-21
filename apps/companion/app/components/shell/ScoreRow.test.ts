import { type ReactNode, createElement } from "react";
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

describe("a football row split into its three ways in", () => {
  const side = (name: string, href: string) => ({ name, short: name.slice(0, 3).toUpperCase(), href });
  const html = renderToStaticMarkup(
    createElement(ScoreRow, {
      home: side("Everton", "/prem/club/11"),
      away: side("Chelsea", "/prem/club/8"),
      score: { home: 0, away: 2 },
      scoreHref: "/prem/match/61",
    }),
  );
  const hrefs = [...html.matchAll(/<a [^>]*href="([^"]+)"/g)].map((m) => m[1]);

  it("links each name to its club and the score to the match, in reading order", () => {
    expect(hrefs).toEqual(["/prem/club/11", "/prem/match/61", "/prem/club/8"]);
  });

  it("keeps every link at the thumb floor and wraps no link around the row", () => {
    expect(html).not.toMatch(/<a [^>]*class="cm-row/);
    expect(html).toMatch(/^<div class="cm-row block">/);
    for (const a of html.match(/<a [^>]*>/g) ?? []) expect(a).toMatch(/min-h-11/);
  });
});

// Craig, 21 Oct 2026: the reader's count in its own column "looks crap"; it goes under the club's name.
describe("a control beside a side's name", () => {
  const side = (name: string, href: string) => ({ name, short: name.slice(0, 3).toUpperCase(), href });
  const control = (label: string) => createElement("button", { type: "button" }, label);
  const render = (under?: { home?: ReactNode; away?: ReactNode }) =>
    renderToStaticMarkup(
      createElement(ScoreRow, {
        home: side("Everton", "/prem/club/11"),
        away: side("Chelsea", "/prem/club/8"),
        score: { home: 0, away: 2 },
        scoreHref: "/prem/match/61",
        under,
      }),
    );

  it("draws each side's control after its own name, home before the score and away after it", () => {
    expect(render({ home: control("2 yours"), away: control("1 yours") })).toMatch(
      /Everton[\s\S]*2 yours[\s\S]*\/prem\/match\/61[\s\S]*Chelsea[\s\S]*1 yours/,
    );
  });

  it("keeps each control a sibling of the name's link, never inside it", () => {
    const html = render({ home: control("2 yours"), away: control("1 yours") });
    for (const a of html.match(/<a [\s\S]*?<\/a>/g) ?? []) expect(a).not.toContain("<button");
  });

  it("pairs only the side that has a control, on one line", () => {
    const html = render({ away: control("1 yours") });
    expect(html.match(/<button/g)).toHaveLength(1);
    expect(html.match(/flex min-w-0 items-center gap-0\.5 max-\[359px\]:gap-0 lg:gap-1\.5/g)).toHaveLength(1);
    expect(html.indexOf("<button")).toBeGreaterThan(html.indexOf("Chelsea"));
  });

  it("draws sides with no control exactly as a row without the prop", () => {
    expect(render({})).toBe(render());
  });
});

// Every other caller passes no `under`: their markup is pinned to what it was before the prop existed.
describe("a row without a control under its names", () => {
  const sides = { home: { name: "Everton", short: "EVE", place: "3rd", href: "/prem/club/11" }, away: { name: "Chelsea", lost: true } };
  it.each([
    ["split", { ...sides, score: { home: 0, away: 2 }, scoreHref: "/prem/match/61", clock: "FT" }],
    ["one link", { ...sides, score: null, pending: "15:00", href: "/league/tie/4" }],
    ["plain, marked", { home: { name: "Mine", mine: true, left: "2 to play", pending: 3 }, away: { name: "Theirs", left: "all played" }, score: { home: null, away: 41 }, marks: true }],
  ])("%s", (_, props) => {
    expect(renderToStaticMarkup(createElement(ScoreRow, props as Parameters<typeof ScoreRow>[0]))).toMatchSnapshot();
  });
});
