import { describe, expect, it } from "vitest";
import { spursVillaDay } from "./__fixtures__/spursVilla";
import { matchInput, moment, reportMan } from "./__fixtures__/built";
import { CHELSEA_BOURNEMOUTH_LEAGUE, LIVERPOOL_CITY_LEAGUE, PALACE_FOREST_LEAGUE } from "./__fixtures__/gw6League";
import { reportsCargo } from "./cargo";
import { deskDay } from "./desk";
import { keyStats } from "./keyStats";
import { manCounts, matchEvents } from "./timeline";
import type { ReportMatchInput, SideFigures } from "./types";

const box = (match: ReportMatchInput, keeperRung: number | null = 3) => {
  const events = matchEvents(match);
  return Object.fromEntries(keyStats(match, events, manCounts(events, match.men), 20, keeperRung).map((k) => [k.label, k.value]));
};

describe("keyStats", () => {
  it("sets Chances created as Most shots is set: the man, the count, then the bracket", () => {
    const desks = deskDay(spursVillaDay());
    const [report] = reportsCargo(desks, { headline: "h", headlines: [], matches: new Map() });
    expect(report.keyStats.find((k) => k.label === "Chances created")?.value).toBe("Sávio 4, Robertson 4 (1 assist)");
  });
});

describe("keyStats for a manager, on Liverpool 0-3 Manchester City", () => {
  const anfield = box(LIVERPOOL_CITY_LEAGUE);

  it("leads with the league's points: the top four, each owner named and an unowned man bare", () => {
    expect(anfield.Points).toBe("Donnarumma 8 (domeitalycoach), Doku 8, Cherki 8 (Cowthenbeef), Anderson 7 (GlengarryHearts)");
  });

  it("names the full-match clean sheets and the men off before the hour, and leaves the red card to the line-ups", () => {
    expect(anfield["Clean sheet, full match"]).toBe("Donnarumma, Guéhi");
    expect(anfield["Off before the hour"]).toBe("Ndiaye 56");
    expect(anfield["Sent off"]).toBeUndefined();
  });
});

describe("keyStats' names", () => {
  it("names each man as his club does: João Pedro, Strand Larsen, de Ligt, Mac Allister", () => {
    expect(box(CHELSEA_BOURNEMOUTH_LEAGUE).Points).toBe("Henderson 16, João Pedro 10 (Cowthenbeef), Palmer 9 (The Raccoons), Rogers 9 (If anyone can, Bannan can)");
    const larsen = reportMan(1, "Jørgen Strand Larsen", "home", { surname: "Strand Larsen", expectedGoals: 0.98 });
    const deLigt = reportMan(2, "Matthijs de Ligt", "away", { line: "D", defensive: 2 });
    const macAllister = reportMan(3, "Alexis Mac Allister", "away", { defensive: 1 });
    const stats = box(matchInput([larsen, deLigt, macAllister], [], [0, 0]));
    expect([stats["xG without a goal"], stats["DefCon"]]).toEqual(["Strand Larsen 0.98", "de Ligt 2, Mac Allister 1"]);
  });
});

describe("keyStats' figures", () => {
  const side = (shots: number, onTarget: number): SideFigures => ({ shots, onTarget });
  const keeper = reportMan(1, "David Raya", "home", { line: "G", saves: 3 });
  const defender = reportMan(2, "Ben White", "home", { line: "D", defensive: 2, expectedAssists: 0.29 });
  const forward = reportMan(3, "Cole Palmer", "away", { expectedGoals: 0.62, expectedAssists: 0.31 });
  const match = matchInput([keeper, defender, forward], [moment("50", "goal", [2, null])], [1, 0], { home: side(13, 6), away: side(15, 4) });

  it("gives the shots with no spaced hyphen and no corners, and never an error leading to a goal", () => {
    expect(box(match).Shots).toBe("13 (6 on target) v 15 (4)");
    expect(Object.keys(box(match))).not.toContain("Errors leading to a goal");
  });

  it("prints saves from the first rung the league pays, and none when the scoring was not read", () => {
    expect(box(match, 3).Saves).toBe("Raya 3");
    expect(box(match, 4).Saves).toBeUndefined();
    expect(box(match, null).Saves).toBeUndefined();
  });

  it("gives the league's defensive points, and xG good enough to score without a goal once", () => {
    expect(box(match)["DefCon"]).toBe("White 2");
    expect(box(match)["xG without a goal"]).toBe("Palmer 0.62");
    expect(box(match)["Top xG"]).toBeUndefined();
  });

  it("prints xA only from 0.3", () => {
    expect(box(match)["Top xA"]).toBe("Palmer 0.31");
  });

  it("lists a missed big chance on gameweek 6 as xG without a goal", () => {
    expect(box(PALACE_FOREST_LEAGUE)["xG without a goal"]).toBe("Delap 1.01");
  });
});
