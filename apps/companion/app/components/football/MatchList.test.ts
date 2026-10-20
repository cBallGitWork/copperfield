import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { FixtureStatus, FootballPlayer, FootballSnapshot } from "@epl/core";
import MatchList from "./MatchList";

vi.mock("next/image", () => ({ default: () => null }));
vi.mock("@/app/desk", () => ({ ROW_NAME: "" }));
vi.mock("@/app/components/shell/Link", () => ({ default: (props: object) => createElement("a", props) }));

/** One match and nobody in it yet, as the gameweek list draws it. */
function list(status: FixtureStatus, now: boolean, mine?: Map<number, FootballPlayer[]>): string {
  const fixture = {
    id: 1, code: 1, gameweek: 7, homeClubId: 1, awayClubId: 2, kickoff: "2026-10-10T14:00:00Z",
    homeScore: status === "upcoming" ? null : 0, awayScore: status === "upcoming" ? null : 0,
    status, settled: false, minutes: 12, homeDifficulty: null, awayDifficulty: null,
  };
  const snapshot = { clubs: [], players: [], fixtures: [fixture], stats: [] } as unknown as FootballSnapshot;
  return renderToStaticMarkup(createElement(MatchList, { snapshot, now, mine }));
}

describe("a match with nothing to report", () => {
  it("never says a match our copy has in play is still to kick off, however old the copy", () => {
    expect(list("live", false)).not.toContain("Kicks off");
  });

  it("says nothing yet while a fresh copy has it in play", () => {
    expect(list("live", true)).toContain("Nothing to report yet.");
  });

  it("says when a match to come kicks off", () => {
    expect(list("upcoming", true)).toContain("Kicks off Sat 15:00");
  });
});

describe("a signed-in reader's rows", () => {
  const others = new Map<number, FootballPlayer[]>([[2, []]]);

  it("holds the count's column on a row with none of his men, so every score sits on one line", () => {
    expect(list("finished", true, others)).toContain("w-12");
  });

  it("gives a row with none of his men a clear edge as wide as the marked one's", () => {
    expect(list("finished", true, others)).toContain("border-l-transparent");
  });

  it("holds no column for a signed-out reader", () => {
    const out = list("finished", true);
    expect(out).not.toContain("w-12");
    expect(out).not.toContain("border-l-transparent");
  });
});

describe("a played match's score", () => {
  it("prints CM's colon in the reading cyan, never an en dash", () => {
    const out = list("finished", true);
    expect(out).not.toContain("0–0");
    expect(out).toMatch(/text-info[^>]*>0<span aria-hidden="true"[^>]*>:<\/span>0</);
  });
});

describe("the way through to the match", () => {
  it.each(["finished", "live", "upcoming"] as const)("leads an opened %s row to its match page", (status) => {
    expect(list(status, true)).toContain('href="/prem/match/1"');
  });

  it("keeps the link out of the summary, so tapping the row still only opens it", () => {
    const summary = list("finished", true).split("</summary>")[0];
    expect(summary).not.toContain("/prem/match/");
  });
});
