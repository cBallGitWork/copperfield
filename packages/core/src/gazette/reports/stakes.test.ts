import { describe, expect, it } from "vitest";
import { heldBy, reportMan, tieWith } from "./__fixtures__/built";
import { HULL_EVERTON_LEAGUE, LIVERPOOL_CITY_LEAGUE, PALACE_FOREST_LEAGUE, gw6Day } from "./__fixtures__/gw6League";
import { deskDay } from "./desk";
import type { SectionPick } from "./sections";
import { dayStakes, leaguePoints } from "./stakes";
import type { HeadToHeadStake, ReportMan } from "./types";

const sunday = deskDay(gw6Day([LIVERPOOL_CITY_LEAGUE, PALACE_FOREST_LEAGUE, HULL_EVERTON_LEAGUE]));
const stakeOf = (name: string) => sunday.flatMap((d) => d.sections).find((s) => s.men.some((m) => m.name === name))?.stake;

describe("the stakes on gameweek 6's Sunday page", () => {
  const page = sunday.flatMap((d) => d.sections.map((s) => s.stake));

  it("tells Doku's drop: a free agent since domeitalycoach let him go on Wednesday", () => {
    expect(stakeOf("Jérémy Doku")).toBe("A free agent since domeitalycoach let him go on Wednesday; eight points.");
  });

  it("says Kamada's and Pino's points are on their sides' benches, and whom one plays, never how the tie stands", () => {
    expect(stakeOf("Daichi Kamada")).toBe("The Truffle Pigs has Kamada on the bench, for eight points against Cowthenbeef; domeitalycoach has Pino on the bench, for six points.");
  });

  it("names a head-to-head once on the page, on the section with both its sides", () => {
    expect(page.join("\n").match(/against (?:The Raccoons|domeitalycoach)\b/gu)).toHaveLength(1);
    expect(stakeOf("Erling Haaland")).toBe("The Raccoons has Haaland, for six points; domeitalycoach has Donnarumma, for eight points.");
    expect(stakeOf("Kiernan Dewsbury-Hall")).toBe("The Raccoons has Dewsbury-Hall, for 11 points; domeitalycoach claimed Maitland-Niles on Wednesday, for five points against The Raccoons.");
  });

  it("prints nothing that goes stale before the gameweek ends: no running score, no men to play, no margin", () => {
    expect(page.join("\n")).not.toMatch(/\d+-\d+|to play|margin|leads|trails|level/u);
  });

  it("gives every man his points, and calls every side singular, as it has him", () => {
    for (const stake of page) expect(stake).toMatch(/\b(?:\d+|one|two|three|four|five|six|seven|eight|nine|no) points?\b/u);
    expect(page.join("\n")).not.toMatch(/\b(?:have|lead|trail|are level)\b/u);
  });

  it("gives a free agent his points and his first league start, naming each man of a shared section", () => {
    expect(stakeOf("Jefferson Lerma")).toBe("Lerma, a free agent, eight points in his first league start this season; Timber, a free agent, seven points.");
    const alone = dayStakes([[{ men: [reportMan(1, "Jefferson Lerma", "home", { points: 8, startsBefore: 0 })], weight: 1 }]])[0][0];
    expect(alone).toBe("A free agent, eight points; his first league start this season.");
  });
});

describe("dayStakes' templates", () => {
  const tie = (opponent = "test2", over = false) => tieWith(opponent, 38, 34, { over });
  const held = (h2h: HeadToHeadStake[], over: Partial<NonNullable<ReportMan["holder"]>> = {}, points = 7) => reportMan(1, "Bukayo Saka", "home", { points, holder: heldBy("Notemail", h2h, over) });
  const one = (m: ReportMan, weight = 1): SectionPick => ({ men: [m], weight });
  const said = (m: ReportMan) => dayStakes([[one(m)]])[0][0];

  it("says who has him, what he scored for them and whom they play this gameweek, every opponent of a double header", () => {
    expect(said(held([tie()]))).toBe("Notemail has him, for seven points against test2.");
    expect(said(held([tie(), tie("test3")]))).toBe("Notemail has him, for seven points against test2 and test3.");
  });

  it("gives a finished tie's result, which cannot go stale, higher figure first", () => {
    expect(said(held([tie("test2", true)]))).toBe("Notemail has him, for seven points, and beat test2 38-34.");
    expect(said(held([tieWith("test2", 34, 38, { over: true })]))).toBe("Notemail has him, for seven points, and lost 38-34 to test2.");
  });

  it("tells a claim this gameweek and a reserve's points, and nothing about a margin", () => {
    expect(said(held([], { since: "Saturday" }))).toBe("Notemail claimed him on Saturday, for seven points.");
    expect(said(held([tie()], { fielded: false }))).toBe("Notemail has him on the bench, for seven points against test2.");
    expect(said(held([tie()], { fielded: false, since: "Friday" }, 0))).toBe("Notemail claimed him on Friday and has him on the bench, for no points against test2.");
  });

  it("names the opponent once on the page, on the weightiest section", () => {
    const [first, second] = [held([tie()]), reportMan(2, "Kai Havertz", "home", { points: 2, holder: heldBy("Notemail", [tie()]) })];
    expect(dayStakes([[one(second, 1)], [one(first, 5)]])).toEqual([["Notemail has him, for two points."], ["Notemail has him, for seven points against test2."]]);
  });

  it("names and prices every man of a section of three", () => {
    const free = (code: number, name: string, points: number, over: Partial<ReportMan> = {}) => reportMan(code, name, "home", { points, ...over });
    const three = [free(1, "Sidiki Cherif", 9, { startsBefore: 0 }), free(2, "Jack Rudoni", 7, { dropped: { team: "Notemail", day: "Friday" } }), free(3, "Milan van Ewijk", 6)];
    expect(dayStakes([[{ men: three, weight: 9 }]])[0][0]).toBe(
      "Cherif, a free agent, nine points in his first league start this season; Rudoni, a free agent since Notemail let him go on Friday, seven points; van Ewijk, a free agent, six points.",
    );
  });

  it("refuses to build a stake without his points: a bug, not a line to print", () => {
    expect(() => said(held([tie()], {}, null as unknown as number))).toThrow(/without his points/u);
    expect(() => said(reportMan(2, "James Justin", "away", { points: null, dropped: { team: "Cowthenbeef", day: "Friday" } }))).toThrow(/without his points/u);
  });

  it("prices points in words to nine, never a figure opening a phrase", () => {
    expect([leaguePoints(1), leaguePoints(13), leaguePoints(-1), leaguePoints(0)]).toEqual(["one point", "13 points", "minus one point", "no points"]);
  });
});
