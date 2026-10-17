import { describe, expect, it } from "vitest";
import {
  CREDITS,
  FPL,
  LIVE,
  MAIL,
  MORE,
  PAPER,
  READ_VIEWS,
  SECTIONS,
  aheadOf,
  barSections,
  drawsOwnGround,
  overflowSections,
  owns,
  sectionOwns,
  sectionsFor,
  tabOwns,
} from "./sections";
import { LEAGUE } from "../../league/routes";
import { POOL } from "../../players/routes";
import { PREM, PREM_FIXTURES } from "../../prem/routes";
import { MY_TEAM, SQUAD } from "../../squad/routes";

// A rival's squad and the reader's own share a folder and differ by one segment,
// so these prove `owns` matches on that segment, not the prefix.

/** A Fantrax team id, which is sixteen characters of base-36. */
const RIVAL = "1b6gp5utmtj36y3g";

const labels = (sections: { label: string }[]) => sections.map((section) => section.label);

/** The phone tab lit on a path, by label; more than one lit is a fault the tests below catch. */
function litOnPhone(matchday: boolean, pathname: string): string[] {
  const sections = sectionsFor(matchday);
  return labels(barSections(sections).filter((section) => tabOwns(sections, section, pathname)));
}

/** The desk rail's entry lit on a path. */
function litOnDesk(matchday: boolean, pathname: string): string[] {
  return labels(sectionsFor(matchday).filter((section) => sectionOwns(section, pathname)));
}

const myTeam = SECTIONS.find((section) => section.href === MY_TEAM);

describe("the My Team plate", () => {
  it("is a section", () => {
    // `Team`: `My Team` overflows the plate's label room at 320.
    expect(myTeam?.label).toBe("Team");
  });

  it("lights on every one of the reader's own tabs", () => {
    for (const tab of ["", "/transfers", "/next", "/fixtures", "/stats"]) {
      expect(owns(myTeam?.routes ?? [], `${MY_TEAM}${tab}`)).toBe(true);
    }
  });

  // `routes: ["/squad"]` would prefix-match every team and light My Team on a rival.
  it("stays dark on a rival, and on the index the sign-in lives on", () => {
    expect(owns(myTeam?.routes ?? [], `/squad/${RIVAL}`)).toBe(false);
    expect(owns(myTeam?.routes ?? [], `/squad/${RIVAL}/stats`)).toBe(false);
    expect(owns(myTeam?.routes ?? [], "/squad")).toBe(false);
  });
});

describe("the bar this gameweek draws", () => {
  it("is Read, Team, Draft, Prem and Data midweek", () => {
    expect(labels(barSections(sectionsFor(false)))).toEqual(["Read", "Team", "Draft", "Prem", "Data"]);
  });

  // Craig, 11 Oct 2026: Team stays on the rail during a gameweek, and Live joins it.
  it("adds Live after Team while football is on, and keeps Team", () => {
    expect(labels(barSections(sectionsFor(true)))).toEqual(["Read", "Team", "Live", "Draft", "Prem", "Data"]);
  });

  it("leaves only FPL behind More, in both states", () => {
    for (const matchday of [false, true]) expect(labels(overflowSections(sectionsFor(matchday)))).toEqual(["FPL"]);
  });

  // Six tabs at 320 leave 49px for a label.
  it("never asks a phone for more than six tabs", () => {
    for (const matchday of [false, true]) expect(barSections(sectionsFor(matchday)).length).toBeLessThanOrEqual(6);
  });

  it("gives every tab a glyph, in both states", () => {
    for (const matchday of [false, true]) {
      for (const section of barSections(sectionsFor(matchday))) expect(section.glyph).toBeDefined();
    }
  });

  it("lists every section flat on the desk", () => {
    expect(labels(sectionsFor(true))).toEqual(["Read", "Team", "Live", "Draft", "Prem", "Data", "FPL"]);
    expect(labels(sectionsFor(false))).toEqual(["Read", "Team", "Draft", "Prem", "Data", "FPL"]);
  });
});

describe("which phone tab lights", () => {
  const cases: [string, string][] = [
    [MAIL, "Read"],
    [`${MAIL}/transfers`, "Read"],
    [PAPER, "Read"],
    ["/paper/the-splash", "Read"],
    [MORE, "Read"],
    [CREDITS, "Read"],
    [FPL, "Read"],
    [`${FPL}/team`, "Read"],
    [MY_TEAM, "Team"],
    [`${MY_TEAM}/fixtures`, "Team"],
    [LEAGUE, "Draft"],
    [`${LEAGUE}/matchups/abc123`, "Draft"],
    [`${LEAGUE}/fixtures`, "Draft"],
    [SQUAD, "Draft"],
    [PREM, "Prem"],
    [PREM_FIXTURES, "Prem"],
    [`${PREM}/club/43`, "Prem"],
    [`${PREM}/match/12345`, "Prem"],
    [POOL, "Data"],
    [`${POOL}/abc`, "Data"],
  ];

  for (const matchday of [false, true]) {
    it(`lights exactly one tab per path ${matchday ? "during" : "outside"} a gameweek`, () => {
      for (const [path, tab] of cases) expect([path, litOnPhone(matchday, path)]).toEqual([path, [tab]]);
    });
  }

  it("lights Live on the Live pages while football is on", () => {
    expect(litOnPhone(true, LIVE)).toEqual(["Live"]);
    expect(litOnPhone(true, "/gw/7")).toEqual(["Live"]);
  });

  it("lights nothing on a rival's squad, which is reached through the league", () => {
    for (const matchday of [false, true]) expect(litOnPhone(matchday, `${SQUAD}/${RIVAL}`)).toEqual([]);
  });
});

describe("which desk rail entry lights", () => {
  it("gives FPL its own entry, so Read stays dark there", () => {
    expect(litOnDesk(false, FPL)).toEqual(["FPL"]);
  });

  it("lights Read on Mail, the paper and More, and Draft on the squad index", () => {
    for (const path of [MAIL, PAPER, MORE]) expect(litOnDesk(false, path)).toEqual(["Read"]);
    expect(litOnDesk(true, SQUAD)).toEqual(["Draft"]);
  });
});

describe("Read's strip", () => {
  it("is Mail, the Gazetta and More, in that order", () => {
    expect(READ_VIEWS.map((view) => view.href)).toEqual([MAIL, PAPER, MORE]);
  });

  it("opens Read on Mail", () => {
    expect(SECTIONS[0]).toMatchObject({ label: "Read", href: MAIL });
  });
});

describe("who draws the ground", () => {
  it("leaves a head-to-head's to the page, which draws its home team's venue", () => {
    expect(drawsOwnGround("/league/matchups/abc123")).toBe(true);
  });

  it("keeps the desk's behind the list of head-to-heads, which has no home side", () => {
    expect(drawsOwnGround("/league/matchups")).toBe(false);
  });

  it("leaves a team's screens to its own layout, which draws the team's venue", () => {
    expect(drawsOwnGround(`${SQUAD}/${RIVAL}`)).toBe(true);
    expect(drawsOwnGround(`${MY_TEAM}/fixtures`)).toBe(true);
  });

  it("keeps the desk's behind the squad index, which is nobody's", () => {
    expect(drawsOwnGround(SQUAD)).toBe(false);
  });
});

describe("the tabs fetched ahead", () => {
  // AutoRefresh fetches these pages, so a tap on a tab draws at once.
  it("are the bar's tabs and the paper on every tick, and Data's ~100KB board once, never FPL", () => {
    expect(aheadOf(sectionsFor(false))).toEqual({
      each: [MAIL, MY_TEAM, LEAGUE, PREM_FIXTURES, PAPER],
      once: [POOL],
    });
  });

  it("add Live while football is on, as the bar does", () => {
    expect(aheadOf(sectionsFor(true)).each).toEqual([MAIL, MY_TEAM, LIVE, LEAGUE, PREM_FIXTURES, PAPER]);
  });
});

describe("the Prem entry", () => {
  const prem = SECTIONS.find((section) => section.label === "Prem");

  // Craig, 24 Sep 2026: "clicking prem tab, default should land on results".
  it("lands on the results", () => {
    expect(prem?.href).toBe(PREM_FIXTURES);
  });

  it("stays current across the whole section, the table included", () => {
    for (const path of [PREM, PREM_FIXTURES, `${PREM}/club/43`]) {
      expect(owns(prem?.routes ?? [], path)).toBe(true);
    }
  });
});
