import { describe, expect, it } from "vitest";
import { PALMER, SAKA, deskOf, matchInput, moment } from "./__fixtures__/built";
import {
  ARSENAL_LEEDS, CHELSEA_BOURNEMOUTH, COVENTRY_NEWCASTLE, HULL_EVERTON, IPSWICH_FULHAM, LIVERPOOL_CITY, PALACE_FOREST, SUNDERLAND_BRIGHTON, UNITED_SPURS,
  VILLA_BRENTFORD,
} from "./__fixtures__/gw6";
import { LIVERPOOL_CITY_LEAGUE } from "./__fixtures__/gw6League";
import { sinceTurn } from "./passages";
import type { MatchEvent } from "./timeline";
import type { ReportMatchInput } from "./types";

const said = (e: MatchEvent) => `${e.minute} ${e.kind} ${e.kind === "substitution" ? e.other?.name : e.man?.name}`;
const plan = (match: ReportMatchInput) => deskOf(match).paragraphs.map((p) => p.map(said));
const since = (match: ReportMatchInput, minute: string) => {
  const desk = deskOf(match);
  const event = desk.events.find((e) => e.minute === minute && e.kind !== "substitution");
  return event === undefined ? null : sinceTurn(event, desk.turn, desk.events);
};

describe("the account's paragraphs on gameweek 6", () => {
  it("runs Liverpool v City in match order: Donnarumma's save, the red card, then the goals", () => {
    // Donnarumma has a section, as on the day, so the save he made is part of the story.
    expect(plan(LIVERPOOL_CITY_LEAGUE)).toEqual([
      ["21 saved Jérémy Jacquet", "62 second-yellow Ryan Gravenberch", "65 goal Erling Haaland"],
      ["68 goal Jérémy Doku", "78 goal Rayan Cherki"],
    ]);
  });

  it("tells a comeback as it came, Leeds in front before Arsenal levelled and won it", () => {
    expect(plan(ARSENAL_LEEDS)).toEqual([["55 goal James Justin", "62 goal Riccardo Calafiori", "70 goal Bruno Guimarães"]]);
    expect(plan(IPSWICH_FULHAM)).toEqual([["24 missed Ryan Sessegnon", "55 goal Ryan Sessegnon", "88 goal Abdoul Ouattara", "90+1 goal Dara O'Shea"]]);
  });

  it("folds a half with one moment in it into the other, rather than leave it a sentence on its own", () => {
    expect(plan(PALACE_FOREST)).toEqual([["3 goal Dan Ndoye", "41 goal Daichi Kamada", "45+4 goal Jefferson Lerma", "59 goal Yéremy Pino"]]);
    expect(plan(SUNDERLAND_BRIGHTON)).toEqual([["34 substitution Thomas Meunier", "53 goal Maxim De Cuyper", "57 sent-off Pascal Struijk", "90+3 goal Jaouen Hadjam"]]);
    expect(plan(UNITED_SPURS)).toEqual([["73 goal Bryan Mbeumo", "78 sent-off Rodrigo Bentancur", "90+2 goal Dominic Solanke"]]);
  });

  it("gives each half its paragraph when both have a passage in them", () => {
    expect(plan(CHELSEA_BOURNEMOUTH)).toEqual([
      ["2 goal Jordan Henderson", "3 goal Morgan Rogers"],
      ["46 goal João Pedro", "51 goal Evanilson", "67 goal João Pedro", "70 goal Jordan Henderson"],
    ]);
    expect(plan(HULL_EVERTON)).toEqual([
      ["27 saved Thierno Barry", "34 ruled-out Brennan Johnson"],
      ["48 goal Joe Gelhardt", "55 goal Kiernan Dewsbury-Hall", "68 goal Thierno Barry", "74 goal Mohamed Belloumi"],
    ]);
    expect(plan(VILLA_BRENTFORD)).toEqual([
      ["10 goal Yehor Yarmoliuk", "12 goal Nicolas Jackson"],
      ["46 substitution Matteo Ruggeri", "52 substitution Kevin Schade", "77 goal John McGinn", "79 goal Kristoffer Ajer"],
    ]);
  });

  it("never tells a moment before one that came earlier", () => {
    for (const match of [LIVERPOOL_CITY_LEAGUE, ARSENAL_LEEDS, CHELSEA_BOURNEMOUTH, HULL_EVERTON, VILLA_BRENTFORD, COVENTRY_NEWCASTLE]) {
      const desk = deskOf(match);
      const order = desk.paragraphs.flat().map((e) => desk.events.indexOf(e));
      expect(order).toEqual([...order].sort((x, y) => x - y));
    }
  });
});

describe("the chances not taken the account tells", () => {
  it("tells one at most, before the turn and part of the story, never Cherki's or Koumas's or Haaland's", () => {
    expect(deskOf(LIVERPOOL_CITY_LEAGUE).chances.map(said)).toEqual(["21 saved Jérémy Jacquet"]);
    expect(deskOf(LIVERPOOL_CITY).chances).toEqual([]);
  });

  it("tells none after the turn, and none that nobody comes back to", () => {
    expect(deskOf(ARSENAL_LEEDS).chances).toEqual([]);
    expect(deskOf(UNITED_SPURS).chances).toEqual([]);
  });
});

describe("sinceTurn", () => {
  it("measures the first consequence from the turn, and the turn from the goal before it", () => {
    expect(since(LIVERPOOL_CITY, "65")).toBe("three minutes after the red card");
    expect(since(SUNDERLAND_BRIGHTON, "57")).toBe("four minutes after De Cuyper's goal");
    expect(since(CHELSEA_BOURNEMOUTH, "3")).toBe("one minute after Henderson's goal");
  });

  it("counts first-half added time as the half's own minutes", () => {
    expect(since(PALACE_FOREST, "45+4")).toBe("eight minutes after Kamada's goal");
  });

  it("measures nothing far off, across half-time, or before the turn", () => {
    expect(since(LIVERPOOL_CITY, "78")).toBeNull();
    expect(since(LIVERPOOL_CITY, "21")).toBeNull();
    const halves = matchInput([SAKA, PALMER], [moment("45+1", "sent-off", [3, null]), moment("50", "goal", [1, null])], [1, 0]);
    expect(since(halves, "50")).toBeNull();
  });
});
