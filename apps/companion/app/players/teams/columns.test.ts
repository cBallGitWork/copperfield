import { describe, expect, it } from "vitest";
import type { Club, PlClubSeason, SeasonTotals } from "@epl/core";
import { TEAM_COLUMNS, TEAM_GROUPS, plateHref, sortHref, sortedTeams, teamsView } from "./columns";
import type { TeamRow } from "./teamRows";

const teamColumn = (key: string) => teamsView({ sort: key }).sort;

const club = (shortName: string): Club => ({ id: shortName.length, code: 1, name: shortName, shortName });

function row(shortName: string, season: Partial<PlClubSeason> | null, squad: Partial<SeasonTotals> | null = null): TeamRow {
  return {
    club: club(shortName),
    season: season === null ? null : ({ clubCode: 1, ...season } as PlClubSeason),
    squad: squad === null ? null : (squad as SeasonTotals),
  };
}

describe("sortedTeams", () => {
  it("orders by the column and sinks an absent figure", () => {
    const rows = [row("ARS", { goals: 8 }), row("HUL", null), row("BHA", { goals: 16 })];
    expect(sortedTeams(rows, teamColumn("g"), true).map((r) => r.club.shortName)).toEqual(["BHA", "ARS", "HUL"]);
    expect(sortedTeams(rows, teamColumn("g"), false).map((r) => r.club.shortName)).toEqual(["ARS", "BHA", "HUL"]);
  });

  it("breaks a tie on the name", () => {
    const tied = [row("CHE", { shots: 60 }), row("ARS", { shots: 60 })];
    expect(sortedTeams(tied, teamColumn("sh"), true).map((r) => r.club.shortName)).toEqual(["ARS", "CHE"]);
  });
});

describe("the columns", () => {
  it("carry no fantasy figure and no fixture run", () => {
    const heads = TEAM_COLUMNS.map((column) => column.head);
    for (const gone of ["FPts", "FA", "Attack", "Defence", "GK", "Bonus", "BPS"]) expect(heads).not.toContain(gone);
  });

  it("print a played nought as nought and a missing season as a dash", () => {
    const goals = teamColumn("g");
    expect(goals.of(row("ARS", { goals: 0 }))).toBe(0);
    expect(goals.of(row("ARS", null))).toBeNull();
  });

  it("share FPL's squad xGC between the eleven who conceded it", () => {
    expect(teamColumn("xgc").of(row("ARS", null, { expectedGoalsConceded: 44 }))).toBeCloseTo(4);
    expect(teamColumn("xg").of(row("ARS", null, null))).toBeNull();
  });

  it("group into four plates in order, Errors folded into Discipline", () => {
    // Each group in one run, so its plate spans it; five did not fit one line at 320 in WebKit.
    const runs = TEAM_COLUMNS.map((column) => column.group).filter((group, at, all) => group !== all[at - 1]);
    expect(runs).toEqual(TEAM_GROUPS.map((group) => group.key));
    expect(TEAM_GROUPS.map((group) => group.label)).toEqual(["Attack", "Chances", "Defence", "Discipline"]);
    expect(TEAM_COLUMNS.filter((column) => column.group === "discipline").map((column) => column.head)).toEqual(["ErS", "ErG", "Fls", "YC", "RC"]);
  });

  it("light the bad end red where more is worse", () => {
    for (const key of ["gc", "xgc", "sha", "ers", "erg", "fls", "yc", "rc"]) expect(teamColumn(key).rank).toBe("low");
  });

  it("fall back to goals for a key nobody knows", () => {
    expect(teamColumn("fpts").key).toBe("g");
  });

  it("link a head to its good end, the sorted one reversed, a plate's lead to the plate", () => {
    const tk = teamColumn("tk");
    expect(sortHref(tk, teamColumn("g"), true)).toBe("/players/teams?sort=tk&dir=desc");
    expect(sortHref(tk, tk, true)).toBe("/players/teams?sort=tk&dir=asc");
    expect(sortHref(teamColumn("gc"), tk, true)).toBe("/players/teams?group=defence");
    expect(sortHref(teamColumn("g"), teamColumn("g"), true)).toBe("/players/teams?sort=g&dir=asc");
    expect(sortHref(teamColumn("g"), teamColumn("g"), false)).toBe("/players/teams");
    expect(sortHref(teamColumn("ers"), tk, true)).toBe("/players/teams?sort=ers&dir=asc");
    expect(sortHref(teamColumn("fls"), tk, true)).toBe("/players/teams?group=discipline");
    expect(sortHref(teamColumn("xa"), tk, true)).toBe("/players/teams?group=chances");
    expect(sortHref(teamColumn("a"), tk, true)).toBe("/players/teams?sort=a&dir=desc");
  });
});

describe("teamsView", () => {
  it("lands an absent or unknown plate on Attack, ordered by goals", () => {
    for (const group of [undefined, "fpts"]) {
      const view = teamsView({ group });
      expect([view.group.key, view.sort.key, view.descending]).toEqual(["attack", "g", true]);
    }
  });

  it("orders a plate by its lead column at its good end", () => {
    const view = teamsView({ group: "defence" });
    expect([view.group.key, view.sort.key, view.descending]).toEqual(["defence", "gc", false]);
  });

  it("leads each plate with its named column: G, xA, GC, Fls", () => {
    const leads = TEAM_GROUPS.map((group) => teamsView({ group: group.key }).sort.key);
    expect(leads).toEqual(["g", "xa", "gc", "fls"]);
    const discipline = teamsView({ group: "discipline" });
    expect([discipline.sort.key, discipline.descending]).toEqual(["fls", false]);
  });

  it("gives every plate a lead from its own run", () => {
    for (const group of TEAM_GROUPS) expect(TEAM_COLUMNS.find((column) => column.key === group.lead)?.group).toBe(group.key);
  });

  it("opens the plate of a sort outside the one asked, so the order is never hidden", () => {
    const view = teamsView({ group: "attack", sort: "fls", dir: "desc" });
    expect([view.group.key, view.sort.key, view.descending]).toEqual(["discipline", "fls", true]);
  });

  it("draws only the plate's columns", () => {
    expect(teamsView({ group: "chances" }).columns.map((column) => column.head)).toEqual(["A", "KP", "BCC", "xA"]);
  });
});

describe("plateHref", () => {
  it("leaves the resting plate bare and names the rest", () => {
    expect(TEAM_GROUPS.map(plateHref)).toEqual(["/players/teams", "/players/teams?group=chances", "/players/teams?group=defence", "/players/teams?group=discipline"]);
  });

  it("is the address a plate's lead at its good end links to", () => {
    for (const group of TEAM_GROUPS) {
      const view = teamsView({ group: group.key });
      expect(sortHref(view.sort, teamColumn("tk"), true)).toBe(plateHref(group));
    }
  });
});
