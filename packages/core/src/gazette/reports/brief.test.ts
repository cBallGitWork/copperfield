import { describe, expect, it } from "vitest";
import { codeOf, spursVilla, spursVillaDay } from "./__fixtures__/spursVilla";
import { deskOf, heldBy, tieWith } from "./__fixtures__/built";
import { CHELSEA_BOURNEMOUTH } from "./__fixtures__/gw6";
import { COVENTRY_NEWCASTLE_LEAGUE, LIVERPOOL_CITY_LEAGUE } from "./__fixtures__/gw6League";
import { buildReportsBrief, matchBlock } from "./brief";
import { deskDay } from "./desk";
import type { MenExtras } from "./men";
import type { ReportDayInput } from "./types";

const input = (over: Partial<ReportDayInput> = {}): ReportDayInput => ({
  ...spursVillaDay([spursVilla({ holders: new Map([[codeOf("Porro"), heldBy("Dave's Dons", [tieWith("Notemail", 49, 40)])]]), points: new Map([[codeOf("Porro"), 2]]) })]),
  ...over,
});
const brief = buildReportsBrief("2026-09-19", 5, deskDay(input()));

describe("buildReportsBrief on Tottenham 2-3 Aston Villa", () => {
  it("never names a source, a percentage or an analyst's term", () => {
    for (const label of [/%/, /\bFPL\b/, /Fantrax/, /Opta/, /\bxG\b/, /\bxA\b/, /expected/i, /big chance/i, /possession/i, /\bbps\b/i, /\bbonus\b/i, /projected/i, /predicted/i, /\brating\b/i, /\bstrength\b/i, /\brank\b/i, /\bmodel\b/i]) {
      expect(brief).not.toMatch(label);
    }
  });

  it("gives each club its short names and its nickname, for a second reference", () => {
    expect(brief).toContain("Tottenham Hotspur (or Spurs or Tottenham or the Lilywhites)");
    expect(brief).toContain("Aston Villa (or Villa or the Villans)");
  });

  it("gives every man his club, including the two the writer would place at their old clubs", () => {
    expect(brief).toContain("Jan Paul van Hecke (Tottenham Hotspur)");
    expect(brief).toContain("Andy Robertson (Tottenham Hotspur)");
  });

  it("carries the worked-out facts and the minute phrases", () => {
    expect(brief).toContain("Aston Villa were 3-0 up with 11 minutes left");
    expect(brief).toContain("four minutes into first-half added time");
  });

  it("gives a man a manager lost to injury a section, and the stake to the desk", () => {
    expect(brief).toMatch(/^- \d\. Pedro Porro \(Tottenham Hotspur\): went off injured/mu);
    expect(brief).not.toMatch(/STAKE|Dave's Dons/u);
    expect(deskDay(input())[0].sections.find((s) => s.men[0].name === "Pedro Porro")?.stake).toBe("Dave's Dons has him, for two points against Notemail.");
  });

  it("plans the paragraphs in match order, marks the turn's, ends on the last of them, and hands the table to the standfirst alone", () => {
    expect(brief).toContain("THE TURN, the match's story, which the standfirst carries and the account tells in its place with the most room: Aston Villa scored twice in 12 minutes, Nicolas Jackson (Aston Villa) first.");
    expect(brief).toContain("THE ACCOUNT, paragraph by paragraph, in the order the match was played.");
    expect(brief.match(/^PARAGRAPH \d/gmu)).toEqual(["PARAGRAPH 1", "PARAGRAPH 2", "PARAGRAPH 3"]);
    expect(brief).toMatch(/^PARAGRAPH 2, with THE TURN: give it the most room:$/mu);
    expect(brief).toContain("END ON van Hecke's goal, and nothing after it.");
    expect(brief).toContain("account 150 words at most, in 3 paragraphs");
    expect(brief).toContain("THE TABLE, for the standfirst and nowhere else in this match:");
  });

  it("gives every goal its maker and its finish on its own line", () => {
    const goals = brief.split("\n").filter((l) => l.startsWith("- GOAL:"));
    expect(goals).toHaveLength(5);
    for (const goal of goals) expect(goal).toMatch(/made by [^;]+; (?:right-footed|left-footed|a header)/u);
  });

  it("leaves bookings, routine changes and fixtures to the page, not the writer", () => {
    expect(brief).not.toMatch(/BOOKED|WHAT COMES NEXT|dangerous attack|tough defence/u);
    expect(brief).not.toContain("Ross Barkley (Aston Villa) came on");
  });

  it("never pairs an injured man with the man who came on", () => {
    expect(brief).toContain("INJURY: Pedro Porro (Tottenham Hotspur) went off injured.");
    expect(brief).not.toMatch(/Gray[^\n]*(for|replac|in place of)[^\n]*Porro/);
  });

  it("hands over no chance not taken that the story never comes back to", () => {
    expect(brief).not.toContain("CHANCE NOT TAKEN");
  });

  it("gives a head-to-head as whom his side plays, never how it stands", () => {
    const buendia = input({ matches: [spursVilla({ holders: new Map([[codeOf("Buendía"), heldBy("Notemail", [tieWith("test2", 34, 38)])]]), points: new Map([[codeOf("Buendía"), 7]]) })] });
    expect(deskDay(buendia)[0].sections.map((s) => s.stake)).toContain("Notemail has him, for seven points against test2.");
  });

  it("says what VAR decided", () => {
    expect(brief).toContain("GOAL RULED OUT after a video review: Mohammed Kudus (Tottenham Hotspur) had scored");
  });

  it("tells a man's season only when every past gameweek was read", () => {
    const manzambi = (season: MenExtras["season"]) => {
      const match = spursVilla({ season, points: new Map([[codeOf("Manzambi"), 9]]) });
      // The script counts each man's club matches once the men are read.
      for (const man of match.men) man.matchesBefore = 4;
      return buildReportsBrief("2026-09-19", 5, deskDay(input({ matches: [match] }))).split("\n").find((line) => line.includes("- 1. Johan Manzambi") || /^- \d\. Johan Manzambi/u.test(line)) ?? "";
    };
    const read = manzambi(new Map([[codeOf("Manzambi"), { startsBefore: 0, matchesBefore: 0, goalsSeason: 9 }]]));
    expect(read).toContain("Johan Manzambi (Aston Villa): one goal, nine in the league this season; made one");
    const unread = manzambi(null);
    expect(unread).toContain("Johan Manzambi (Aston Villa): one goal; made one");
  });
});

describe("buildReportsBrief on Liverpool 0-3 Manchester City", () => {
  const block = matchBlock(deskOf(LIVERPOOL_CITY_LEAGUE));

  it("names the keeper behind a save it tells", () => {
    expect(block).toContain("CHANCE NOT TAKEN: Jérémy Jacquet (Liverpool), a shot from close range; saved by Gianluigi Donnarumma (Manchester City).");
  });

  it("folds a substitute's arrival into the goal he scored or made, with no line of its own", () => {
    expect(block).toContain("Jérémy Doku (Manchester City), a substitute on for Iliman Ndiaye in the 56th minute, made by Elliot Anderson");
    expect(block).toContain("made by Josko Gvardiol (Manchester City), a substitute on for Nico O'Reilly in the 66th minute, with a header");
    expect(block).not.toMatch(/^- ON:/mu);
  });

  it("measures the first goal from the red card, so the writer does no sums", () => {
    expect(block).toMatch(/GOAL: 1-0 to Manchester City\. Erling Haaland[^\n]*\| three minutes after the red card\]/u);
  });

  it("tells the writer the name a man goes by after his first, where it is not his last word", () => {
    expect(matchBlock(deskOf(CHELSEA_BOURNEMOUTH))).toContain("João Pedro (then João Pedro)");
    expect(block).not.toContain("(then");
  });

  it("leaves the box's figures out of the facts the account may use", () => {
    expect(block).not.toMatch(/on target|clear chance|of the ball/u);
  });
});

describe("buildReportsBrief on Coventry 4-1 Newcastle", () => {
  const block = matchBlock(deskOf(COVENTRY_NEWCASTLE_LEAGUE));

  it("asks for one section on all three free agents who share one, with words for each man", () => {
    expect(block).toMatch(/^- \d\. ONE SECTION ON ALL THREE MEN, each named: /mu);
    expect(block).toContain("3 sections of 20 to 45 words each, 20 more for each man after the first.");
  });

  it("gives defensive points as points the league pays, and no section to a 3-point keeper", () => {
    expect(block).not.toMatch(/^- \d\. [^\n]*Carl Rushworth/mu);
    expect(block).toContain("Brandon Thomas-Asante (Coventry City): made one; one defensive point (most a match pays two)");
  });
});
