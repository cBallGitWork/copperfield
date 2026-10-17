import { describe, expect, it } from "vitest";
import { codeOf, spursVilla, spursVillaDay } from "./__fixtures__/spursVilla";
import { matchBlock } from "./brief";
import { checkReports } from "./checks";
import { REPORT_FIXED } from "./words";
import { deskDay } from "./desk";
import type { ReportPiece, ReportsDraft } from "./draft";
import { PALMER, SAKA, deskOf, heldBy, matchInput, moment, reportMan } from "./__fixtures__/built";
import type { ReportMatchInput } from "./types";
import { CHELSEA_BOURNEMOUTH } from "./__fixtures__/gw6";
import { COVENTRY_NEWCASTLE_LEAGUE } from "./__fixtures__/gw6League";

// A clean piece written for this test from the brief's own facts; the mutations below each break one rule.

// The clean piece below is written to this length; the config's budget moves as the paper's does.
const desks = deskDay(spursVillaDay([spursVilla({ holders: new Map([[codeOf("Buendía"), heldBy("Notemail")]]), points: new Map([[codeOf("Buendía"), 12], [codeOf("Manzambi"), 9], [codeOf("van Hecke"), 6]]) })]))
  .map((d) => ({ ...d, budget: { ...d.budget, account: 130 } }));
const blocks = new Map([[2645244, matchBlock(desks[0])]]);
const ctx = { desks, blocks, gameweek: 5, past: [] };

const CLEAN: ReportPiece = {
  standfirst: "Aston Villa won 3-2 at Tottenham Hotspur for their first win of the season, leaving Spurs in the bottom three.",
  account: [
    "Pedro Porro went off injured after 19 minutes, Archie Gray coming on. Johan Manzambi put Villa ahead just before the interval, set up by Boubacar Kamara.",
    "Mohammed Kudus had a goal ruled out after a video review on the hour. Nicolas Jackson doubled Villa's lead midway through the second half from a Manzambi pass. Emiliano Buendía struck the third 12 minutes after Jackson's goal, from outside the box into the top corner, supplied by John McGinn.",
    "Conor Gallagher replied four minutes from time from a Kudus ball. Jan Paul van Hecke headed in a cross from Andy Robertson deep into added time.",
  ].join("\n"),
  sections: [
    {
      head: "Manzambi marks his start",
      pitch: "Manzambi was part of both of Villa's opening goals in his first league start of the season, trying his luck four times, twice on target, before he was taken off.",
      stake: "A free agent, so a goal and an assist went unclaimed.",
    },
    {
      head: "Buendía finds the corner",
      pitch: "Buendía played the whole match and had three attempts, two of them on target, the last of them the third goal. He also teed up three for team-mates.",
      stake: "Seven points for Notemail, whose man he is.",
    },
    {
      head: "Van Hecke's header",
      pitch: "His header was the only attempt van Hecke had all match, and it came from a set piece.",
      stake: "Nobody has him.",
    },
  ],
};
const draft = (piece: Partial<ReportPiece> = {}, headline = "Villa hold on at Tottenham"): ReportsDraft => ({
  headline,
  headlines: [headline],
  matches: new Map([[2645244, { ...CLEAN, ...piece }]]),
});
const blocking = (d: ReportsDraft) => checkReports(d, ctx).filter((f) => f.severity !== "warn");
const checksOf = (d: ReportsDraft) => blocking(d).map((f) => `${f.severity}: ${f.check} (${f.evidence})`);

describe("checkReports", () => {
  it("passes a clean piece with nothing to send back", () => {
    expect(checksOf(draft())).toEqual([]);
  });

  it("refuses a percentage and a fantasy game's term outright", () => {
    expect(checksOf(draft({ account: `${CLEAN.account} Spurs had 64% of the ball.` }))).toEqual(expect.arrayContaining([expect.stringMatching(/^hard: names a source/)]));
    expect(checksOf(draft({ sections: [{ ...CLEAN.sections[0], pitch: "His xG was high." }, ...CLEAN.sections.slice(1)] }))).toEqual(expect.arrayContaining([expect.stringMatching(/^hard: a fantasy game's term/)]));
  });

  it("refuses a scoreline the match never had, and sends back one written lower first", () => {
    expect(checksOf(draft({ account: `${CLEAN.account} It finished 4-2.` }))).toEqual(expect.arrayContaining([expect.stringMatching(/^hard: a scoreline the match never had \(4-2\)/)]));
    expect(checksOf(draft({ standfirst: "Tottenham Hotspur lost 2-3 to Aston Villa, and are without a win." }))).toEqual(expect.arrayContaining([expect.stringMatching(/higher first/)]));
  });

  it("refuses a figure the facts do not give", () => {
    expect(checksOf(draft({ account: `${CLEAN.account} Villa had 17 shots.` }))).toEqual(expect.arrayContaining([expect.stringMatching(/^hard: a figure the facts do not give \(17\)/)]));
  });

  it("reads the 80th minute as a minute, not a clock or a place in the table", () => {
    const account = `${CLEAN.account.replace("Aston Villa were 3-0 up", "From the 80th minute Aston Villa, 3-0 up,")}`;
    expect(checksOf(draft({ account })).filter((f) => /clock|table belongs/.test(f))).toEqual([]);
  });

  it("sends back a clock minute and a stock phrase", () => {
    expect(checksOf(draft({ account: CLEAN.account.replace("after 19 minutes", "on 19'") }))).toEqual(expect.arrayContaining([expect.stringMatching(/a minute as a clock/)]));
    expect(checksOf(draft({ account: `${CLEAN.account} It was a pulsating encounter.` }))).toEqual(expect.arrayContaining([expect.stringMatching(/a phrase this paper does not print \(pulsating\)/)]));
  });

  it("lifts the sequence ban: came on is a fact this desk holds, though never a sentence of its own", () => {
    expect(checksOf(draft({ account: `${CLEAN.account} Archie Gray came on.` }))).toEqual(["send-back: a substitution on its own; it goes in the sentence of his goal (Archie Gray came on.)"]);
  });

  it("keeps draft words out of everything the writer files, and never checks the desk's stake", () => {
    expect(checksOf(draft({ sections: [{ ...CLEAN.sections[0], pitch: `${CLEAN.sections[0].pitch} A haul.` }, ...CLEAN.sections.slice(1)] }))).toEqual(expect.arrayContaining([expect.stringMatching(/a draft word in the football \(haul\)/)]));
    expect(checksOf(draft({ sections: [{ ...CLEAN.sections[0], stake: "A free agent, and it was a haul." }, ...CLEAN.sections.slice(1)] }))).toEqual([]);
  });

  it("sends back advice and a forecast of selection", () => {
    expect(checksOf(draft({ sections: [{ ...CLEAN.sections[0], pitch: `${CLEAN.sections[0].pitch} Snap him up.` }, ...CLEAN.sections.slice(1)] }))).toEqual(expect.arrayContaining([expect.stringMatching(/advice/)]));
    expect(checksOf(draft({ account: `${CLEAN.account} Archie Gray should start at Old Trafford.` }))).toEqual(expect.arrayContaining([expect.stringMatching(/forecast of selection|a phrase this paper does not print \(should start\)/)]));
  });

  it("calls 3-2 from 3-0 no comeback", () => {
    expect(checksOf(draft({ account: `${CLEAN.account} The comeback fell short.` }))).toEqual(expect.arrayContaining([expect.stringMatching(/a comeback that did not finish level or ahead/)]));
  });

  it("sends back goals told out of order, but not a scorer named earlier for something else", () => {
    expect(checksOf(draft({ account: "Pedro Porro went off injured in the 19th minute. Emiliano Buendía scored from outside the box. Johan Manzambi put Villa ahead. Nicolas Jackson scored. Conor Gallagher replied. Jan Paul van Hecke headed in." }))).toEqual(expect.arrayContaining([expect.stringMatching(/out of order|leaves out a scorer/)]));
  });

  it("sends back a piece that leaves out the injury", () => {
    expect(checksOf(draft({ account: CLEAN.account.replace("Pedro Porro went off injured after 19 minutes, Archie Gray coming on. ", "") }))).toEqual(expect.arrayContaining([expect.stringMatching(/leaves out a goal, a red, a penalty, a VAR call or an injury/)]));
  });

  it("sends back a standfirst without both clubs or the score", () => {
    expect(checksOf(draft({ standfirst: "Villa held on in north London for their first win." }))).toEqual(expect.arrayContaining([expect.stringMatching(/names both clubs/), expect.stringMatching(/gives the score/)]));
  });

  it("lets a head call a club by its nickname, but never a standfirst, where the club is first named", () => {
    const heads = CLEAN.sections.map((section, i) => (i === 0 ? { ...section, head: "The Lilywhites' afternoon" } : section));
    expect(checksOf(draft({ sections: heads }))).not.toEqual(expect.arrayContaining([expect.stringMatching(/a head names a man or club/)]));
    expect(checksOf(draft({ standfirst: "The Lilywhites lost 3-2 to Aston Villa." }))).toEqual(expect.arrayContaining([expect.stringMatching(/names both clubs/)]));
  });

  it("sends back a record the facts do not give", () => {
    expect(checksOf(draft({ account: `${CLEAN.account} Villa are unbeaten.` }))).toEqual(expect.arrayContaining([expect.stringMatching(/a record the facts do not give/)]));
  });

  it("sends back the wrong number of sections and a head naming nobody", () => {
    expect(checksOf(draft({ sections: CLEAN.sections.slice(0, 2) }))).toEqual(expect.arrayContaining([expect.stringMatching(/3 sections, not 2/)]));
    expect(checksOf(draft({ sections: [{ ...CLEAN.sections[0], head: "A busy afternoon" }, ...CLEAN.sections.slice(1)] }))).toEqual(expect.arrayContaining([expect.stringMatching(/a head names a man or club/)]));
  });

  it("calls a man by his name, not his nationality", () => {
    expect(checksOf(draft({ account: `${CLEAN.account} The Dutchman was booked.` }))).toEqual(expect.arrayContaining([expect.stringMatching(/anything but his name/)]));
  });

  it("sends back a ground recalled from memory, and a shot the commentary never described", () => {
    expect(checksOf(draft({ account: `${CLEAN.account} Villa ended the wait at the Lane.` }))).toEqual(expect.arrayContaining([expect.stringMatching(/does not print \(the Lane\)/)]));
    expect(checksOf(draft({ account: `${CLEAN.account} Buendía curved it in.` }))).toEqual(expect.arrayContaining([expect.stringMatching(/does not print \(curved\)/)]));
  });

  it("finds van Hecke at the start of a sentence, where he is Van Hecke", () => {
    const account = CLEAN.account.replace("Jan Paul van Hecke headed in a cross", "Van Hecke, Jan Paul van Hecke, headed in a cross");
    expect(checksOf(draft({ account }))).toEqual([]);
  });

  it("refuses a starter called a substitute, and sends back a name without its accents", () => {
    const sections = [CLEAN.sections[0], { ...CLEAN.sections[1], head: "Buendía off the bench" }, CLEAN.sections[2]];
    expect(checksOf(draft({ sections }))).toEqual(expect.arrayContaining([expect.stringMatching(/^hard: a starter called a substitute/)]));
    expect(checksOf(draft({ account: `${CLEAN.account} Buendia was the pick.` }))).toEqual(expect.arrayContaining([expect.stringMatching(/without its accents \(Buendia\)/)]));
  });

  it("lets the man who came on be the one who came on", () => {
    expect(checksOf(draft({ account: CLEAN.account.replace("from a Kudus ball", "from a ball by Kudus, who came on at half-time") }))).toEqual([]);
  });

  it("lets an injury sentence name the man who came on after the starter who went off", () => {
    expect(checksOf(draft({ account: CLEAN.account }))).toEqual([]);
  });

  it("needs the ruled-out goal told as ruled out, not only its man named", () => {
    const account = CLEAN.account.replace("Mohammed Kudus had a goal ruled out after a video review on the hour. ", "");
    expect(checksOf(draft({ account }))).toEqual(expect.arrayContaining([expect.stringMatching(/leaves out .* \(ruled-out Mohammed Kudus\)/)]));
  });

  it("sends back a section about another man than the desk chose, a head on a routine change, and the league in the football", () => {
    const swapped = [CLEAN.sections[1], CLEAN.sections[0], CLEAN.sections[2]];
    expect(checksOf(draft({ sections: swapped }))).toEqual(expect.arrayContaining([expect.stringMatching(/section 1 is about Johan Manzambi/)]));
    const routine = [CLEAN.sections[0], { ...CLEAN.sections[1], head: "Buendía comes on" }, CLEAN.sections[2]];
    expect(checksOf(draft({ sections: routine }))).toEqual(expect.arrayContaining([expect.stringMatching(/a head on a routine start or change/)]));
    const league = [CLEAN.sections[0], { ...CLEAN.sections[1], pitch: `${CLEAN.sections[1].pitch} Notemail will be pleased.` }, CLEAN.sections[2]];
    expect(checksOf(draft({ sections: league }))).toEqual(expect.arrayContaining([expect.stringMatching(/a team in this league named in the football; the desk prints the stake \(Notemail\)/)]));
  });

  it("sends back whose a man is, said any way at all", () => {
    for (const said of ["He belongs to Villa's manager.", "He is Villa's man.", "He is one of Tottenham Hotspur's players."]) {
      const sections = [CLEAN.sections[0], { ...CLEAN.sections[1], pitch: `${CLEAN.sections[1].pitch} ${said}` }, CLEAN.sections[2]];
      expect(checksOf(draft({ sections }))).toEqual(expect.arrayContaining([expect.stringMatching(/whose a man is/)]));
    }
  });

  it("keeps the table in the standfirst, a section off the account's ground, and bookings out of the account", () => {
    expect(checksOf(draft({ account: `${CLEAN.account} Spurs stay in the bottom three.` }))).toEqual(expect.arrayContaining([expect.stringMatching(/the table belongs to the standfirst/)]));
    const retold = [{ ...CLEAN.sections[0], pitch: `${CLEAN.sections[0].pitch} Manzambi put Villa ahead just before the interval.` }, ...CLEAN.sections.slice(1)];
    expect(checksOf(draft({ sections: retold }))).toEqual(expect.arrayContaining([expect.stringMatching(/a section retells the account/)]));
    expect(checksOf(draft({ account: `${CLEAN.account} Matty Cash was booked in added time.` }))).toEqual(expect.arrayContaining([expect.stringMatching(/a booking in the account/)]));
  });

  it("allows the goal total", () => {
    expect(checksOf(draft({ account: `${CLEAN.account} It was a five-goal match.` }))).toEqual([]);
  });
});

describe("checkReports on João Pedro", () => {
  const desk = deskOf(CHELSEA_BOURNEMOUTH);
  const halves = (account: string) =>
    checkReports({ headline: "", headlines: [], matches: new Map([[9001, { standfirst: "Chelsea beat AFC Bournemouth 5-1.", account, sections: [] }]]) }, { desks: [desk], blocks: new Map([[9001, matchBlock(desk)]]), gameweek: 6, past: [] })
      .filter((f) => f.check.startsWith("a man cut to half"));

  it("sends back the club's João Pedro cut to Pedro, and lets Pedro Neto be Pedro Neto", () => {
    expect(halves("João Pedro scored twice. Pedro made the second.").map((f) => f.evidence)).toEqual(["Pedro"]);
    expect(halves("João Pedro scored twice, the first from Pedro Neto's pass.")).toEqual([]);
  });
});

describe("checkReports on a made-up match", () => {
  const faultsOn = (match: ReportMatchInput, account: string) => {
    const desk = deskOf(match);
    const piece = { standfirst: "Arsenal beat Chelsea.", account, sections: [] };
    return checkReports({ headline: "", headlines: [], matches: new Map([[9001, piece]]) }, { desks: [desk], blocks: new Map([[9001, matchBlock(desk)]]), gameweek: 7, past: [] });
  };

  it("gives a section words for each of its men, three as well as two", () => {
    const desk = deskOf(COVENTRY_NEWCASTLE_LEAGUE);
    const three = desk.sections.findIndex((s) => s.men.length === 3);
    const pitch = `${desk.sections[three].men.map((m) => m.name).join(" and ")} ${"played on ".repeat(40)}`.trim();
    const sections = desk.sections.map((s, i) => ({ head: `${s.men[0].surname} scores`, pitch: i === three ? pitch : s.men[0].name, stake: s.stake }));
    const piece = { standfirst: "Coventry City beat Newcastle United 4-1.", account: "Rudoni scored.", sections };
    const faults = checkReports({ headline: "", headlines: [], matches: new Map([[5, piece]]) }, { desks: [desk], blocks: new Map([[5, matchBlock(desk)]]), gameweek: 6, past: [] });
    expect(faults.filter((f) => f.check.startsWith("a section of"))).toEqual([]);
  });

  it("never counts one of football's fixed phrases as a repeat, each logged as one, and still catches a real repeat", () => {
    const match = matchInput([SAKA, PALMER], [moment("10", "goal", [1, null]), moment("70", "goal", [3, null])], [1, 1]);
    const repeats = (account: string) => faultsOn(match, account).filter((f) => /twice|too often|leaned on|same phrase|recent report/u.test(f.check)).map((f) => f.evidence);
    for (const phrase of REPORT_FIXED) expect(repeats(`Saka scored ${phrase} after ten minutes. Palmer replied ${phrase} soon after.`).join(" | ")).not.toContain(phrase);
    expect(repeats("Saka met a deep cross after ten minutes. Palmer met a deep cross soon after.")).toContain("a deep cross ×2");
  });

  it("lets a man who scored twice be named once", () => {
    const match = matchInput([SAKA, PALMER], [moment("10", "goal", [1, null]), moment("20", "goal", [1, null])], [2, 0]);
    expect(faultsOn(match, "Saka scored twice before half-time.").filter((f) => f.check === "the goals out of order")).toEqual([]);
  });

  it("finds an injury, a penalty and an own goal told at the start of a sentence", () => {
    const james = reportMan(5, "Reece James", "away", { started: false, onAt: "60" });
    const match = matchInput([SAKA, PALMER, james], [
      moment("30", "penalty-goal", [1, null]), moment("60", "substitution", [5, 3], { injury: true }), moment("70", "own-goal", [5, null]),
    ], [2, 0]);
    const account = "Penalty taken by Saka went in. Injury ended Palmer's match. Own goal by James made it two.";
    expect(faultsOn(match, account).filter((f) => f.check.startsWith("leaves out"))).toEqual([]);
  });
});
