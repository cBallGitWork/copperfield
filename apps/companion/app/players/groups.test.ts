import { describe, expect, it } from "vitest";
import { mapLeagueInfo } from "@epl/core";
import real from "../../../../packages/core/src/league/fantrax/__fixtures__/leagueInfoScoringReal.json";
import { columnsIn, groupFor, groupSort, platesFor, sortableIn } from "./groups";
import { activeSort } from "./query";
import { boardView, onPlate } from "./views";

// The real league's Adv Stats on 19 Oct 2026: its read carries none of A, AF or Sv.
const READ = new Set(["GP", "Min", "G", "AT", "YC", "RC", "DFP", "DFP3", "PKM", "OG", "GAO", "CS", "GA", "PKS", "GKP"]);
const stats = boardView("stats", mapLeagueInfo(real).scoringCategories);
const plates = platesFor(sortableIn(stats.columns, READ));

describe("Adv Stats' plates (Craig, 19 Oct 2026: \"split into attack/defending\")", () => {
  it("offers Attack, Creating, Defence, Discipline and Attributes, with no All", () => {
    expect(plates.map((plate) => plate.label)).toEqual(["Attack", "Creating", "Defence", "Discipline", "Attributes"]);
  });

  it("rests on Attack, and an address bar naming a plate it lacks lands there too", () => {
    expect(groupFor(undefined, plates)).toBe("attacking");
    expect(groupFor("all", plates)).toBe("attacking");
    expect(groupFor("defensive", plates)).toBe("defensive");
  });

  it("orders each plate by its own column: xG, xA, tackles won", () => {
    const sorted = (group: string | undefined) => activeSort({}, onPlate(stats, groupFor(group, plates))).column.key;
    expect([sorted(undefined), sorted("creating"), sorted("defensive")]).toEqual(["xg", "xa", "tkl"]);
    expect(activeSort({ sort: "sh" }, onPlate(stats, "defensive")).column.key).toBe("sh");
  });

  it("opens Attributes on its first rating, its own columns only, no xG before them (UX-4)", () => {
    expect(groupSort("attributes")).toBe("acc");
    const view = onPlate(stats, "attributes");
    const keys = columnsIn(view.columns, "attributes", activeSort({}, view).column.key, READ).map((column) => column.key);
    expect(keys.slice(0, 2)).toEqual(["name", "acc"]);
    expect(keys.every((key) => key === "name" || view.columns.find((column) => column.key === key)?.group === "attributes")).toBe(true);
  });

  it("draws the whole board where there are no plates, as on Players", () => {
    expect(groupFor(undefined, [])).toBe("all");
  });

  it("offers none over a lone group, which would only repeat the board", () => {
    expect(platesFor(stats.columns.filter((column) => column.group === undefined || column.group === "attacking"))).toEqual([]);
  });
});
