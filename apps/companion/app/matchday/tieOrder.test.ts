import { describe, expect, it } from "vitest";
import { CUPS, LEAGUE_COMPETITION, LEAGUE_NAME, type CompetitionTie } from "@epl/core";
import { readerFirst, tieGroupTitle } from "./tieOrder";

// GW7's review: the reader's tie was the last of five league rows, below the tab bar on a six-match Saturday.

function tie(home: string, away: string): CompetitionTie {
  return {
    competition: LEAGUE_COMPETITION,
    round: null,
    home: { label: home, team: { teamId: home, name: home } },
    away: { label: away, team: { teamId: away, name: away } },
  } as unknown as CompetitionTie;
}

const TIES = [tie("glen", "ohi"), tie("truf", "bru"), tie("beef", "atl"), tie("dome", "hazza"), tie("bannan", "racc")];
const labels = (ties: readonly CompetitionTie[]) => ties.map((each) => `${each.home.label}-${each.away.label}`);

describe("readerFirst", () => {
  it("puts the reader's own tie first, home or away, and keeps the rest in order", () => {
    expect(labels(readerFirst(TIES, "racc"))).toEqual(["bannan-racc", "glen-ohi", "truf-bru", "beef-atl", "dome-hazza"]);
    expect(labels(readerFirst(TIES, "beef"))).toEqual(["beef-atl", "glen-ohi", "truf-bru", "dome-hazza", "bannan-racc"]);
  });

  it("leaves the order alone for a signed-out reader, or one with no tie this gameweek", () => {
    expect(labels(readerFirst(TIES, null))).toEqual(labels(TIES));
    expect(labels(readerFirst(TIES, "nobody"))).toEqual(labels(TIES));
  });

  it("passes over a side not yet drawn", () => {
    const undrawn = { ...tie("x", "y"), home: { label: "Winner A" }, away: { label: "Winner B" } } as CompetitionTie;
    expect(labels(readerFirst([undrawn, tie("racc", "ohi")], "racc"))).toEqual(["racc-ohi", "Winner A-Winner B"]);
  });
});

describe("tieGroupTitle", () => {
  it("heads the league's ties with its full name and a cup's with its round", () => {
    expect(tieGroupTitle({ competition: LEAGUE_COMPETITION, round: null })).toBe(LEAGUE_NAME);
    expect(tieGroupTitle({ competition: CUPS[0], round: "Semi-final" })).toBe(`${CUPS[0].name} · Semi-final`);
    expect(tieGroupTitle({ competition: CUPS[0], round: null })).toBe(CUPS[0].name);
  });
});
