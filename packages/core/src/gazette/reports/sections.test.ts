import { describe, expect, it } from "vitest";
import { heldBy, matchInput, moment, reportMan } from "./__fixtures__/built";
import {
  CHELSEA_BOURNEMOUTH_LEAGUE, COVENTRY_NEWCASTLE_LEAGUE, HULL_EVERTON_LEAGUE, LIVERPOOL_CITY_LEAGUE, PALACE_FOREST_LEAGUE, gw6Day,
} from "./__fixtures__/gw6League";
import { deskDay } from "./desk";
import { pickSections, weightOf } from "./sections";
import { bestMarked } from "./star";
import { matchEvents } from "./timeline";
import type { ReportMatchInput } from "./types";

const picked = (match: ReportMatchInput, budget: number) =>
  pickSections(match.men, matchEvents(match), budget, bestMarked(match)?.m ?? null).map((p) => p.men.map((m) => m.name).join(" + "));

describe("pickSections on gameweek 6", () => {
  it("gives Henderson, a free agent with two goals and an assist, a section in Chelsea 5-1 Bournemouth", () => {
    expect(picked(CHELSEA_BOURNEMOUTH_LEAGUE, 2)).toEqual(["Jordan Henderson", "João Pedro"]);
  });

  it("gives Doku, a free agent dropped on Wednesday who scored, a section at Anfield", () => {
    expect(picked(LIVERPOOL_CITY_LEAGUE, 3)).toContain("Jérémy Doku");
  });

  it("tells both sides of a head-to-head in one section first: a keeper's eight from saves is a story", () => {
    expect(picked(LIVERPOOL_CITY_LEAGUE, 3)).toEqual(["Jérémy Doku", "Erling Haaland + Gianluigi Donnarumma", "Elliot Anderson + Marc Guéhi"]);
  });

  it("puts the points two managers left on their benches in one section, and two free agents who scored or made one in the other", () => {
    expect(picked(PALACE_FOREST_LEAGUE, 2)).toEqual(["Daichi Kamada + Yéremy Pino", "Jefferson Lerma + Quinten Timber"]);
  });

  it("gives Coventry 4-1 Newcastle, where hardly anyone is owned, three sections: two scorers alone, the other free agents in one", () => {
    expect(picked(COVENTRY_NEWCASTLE_LEAGUE, 3)).toEqual(["Sidiki Cherif", "Jack Rudoni", "Brandon Thomas-Asante + Sven Botman + Nico González"]);
  });

  it("sets a points floor, whatever earned them: a 3-point keeper and a 4-point defender are no story", () => {
    const named = picked(COVENTRY_NEWCASTLE_LEAGUE, 3).join(" + ");
    expect(named).not.toMatch(/Rushworth|Yirenkyi|Bobby Thomas/u);
  });

  it("never passes the budget on the day's page: the lead three, any other two", () => {
    const day = deskDay(gw6Day([LIVERPOOL_CITY_LEAGUE, PALACE_FOREST_LEAGUE, HULL_EVERTON_LEAGUE, CHELSEA_BOURNEMOUTH_LEAGUE, COVENTRY_NEWCASTLE_LEAGUE]));
    expect(day.map((d) => d.sections.length <= (d.lead ? 3 : 2))).toEqual(day.map(() => true));
    for (const d of day) for (const s of d.sections) expect(s.men.length).toBeLessThanOrEqual(3);
  });
});

describe("pickSections' themes and budget", () => {
  const free = (code: number, name: string, points: number) => reportMan(code, name, "away", { points });
  const held = (code: number, name: string, points: number) => reportMan(code, name, "home", { points, holder: heldBy("Notemail") });

  it("holds the budget: free agents who outscored every owned man share one section rather than pass it", () => {
    const match = matchInput([held(1, "Bukayo Saka", 6), free(3, "Cole Palmer", 9), free(4, "Enzo Fernandez", 8)], [moment("10", "goal", [3, null]), moment("20", "goal", [4, null]), moment("30", "goal", [1, null])], [1, 2]);
    expect(picked(match, 1)).toEqual(["Cole Palmer + Enzo Fernandez"]);
  });

  it("ranks by points and news, never by the Star man's mark", () => {
    const made = { ...matchInput([held(1, "Bukayo Saka", 8), held(2, "Kai Havertz", 7)], [moment("10", "goal", [1, 2])], [1, 0]), marks: new Map([[2, 9]]) };
    expect(picked(made, 1)).toEqual(["Bukayo Saka"]);
  });
});

describe("pickSections without points", () => {
  it("gives no section to a man whose points the league never priced, since his stake would carry no figure", () => {
    const unread = reportMan(3, "James Justin", "away", { points: null, dropped: { team: "Cowthenbeef", day: "Friday" } });
    const priced = reportMan(1, "Bukayo Saka", "home", { points: 2, holder: heldBy("Notemail") });
    const match = { ...matchInput([priced, unread], [moment("55", "goal", [3, null]), moment("60", "goal", [1, null])], [1, 1]), marks: new Map([[3, 9]]) };
    expect(picked(match, 2)).toEqual(["Bukayo Saka"]);
  });
});

describe("weightOf", () => {
  it("adds a goal's worth, a bench's and a free agent's to the points", () => {
    const bench = reportMan(1, "Daichi Kamada", "home", { points: 8, holder: heldBy("Pigs", [], { fielded: false }) });
    expect(weightOf(bench, 1)).toBe(8 + 3 + 6);
    expect(weightOf(reportMan(2, "Jordan Henderson", "home", { points: 16 }), 3)).toBe(16 + 9 + 5);
    expect(weightOf(reportMan(3, "Nico O'Reilly", "home", { points: 5 }), 0)).toBe(5);
  });
});
