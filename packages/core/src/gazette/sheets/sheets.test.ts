import { describe, expect, it } from "vitest";
import { debuts } from "./changes";
import { fullPrintName, printName, sheetOf } from "./sheet";
import { man, rostered, side } from "./__fixtures__/sides";

const XI = ["Raya:G:1", "Saliba:D:1", "Gabriel:D:1", "Munoz:D:2", "Rice:M:1", "Saka:M:1", "Palmer:M:3", "Mbeumo:M:4", "Isak:F:5", "Wood:F:6", "Watkins:F:7"];

describe("sheetOf", () => {
  it("reads a side in team-sheet order, starters and bench apart", () => {
    const sheet = sheetOf(rostered("a", ["Isak:F:5", "Raya:G:1", "Rice:M:1", "Saliba:D:1"], ["Kepa:G:1"]));
    expect(sheet.starters.map((each) => each.player.name)).toEqual(["Raya", "Saliba", "Rice", "Isak"]);
    expect(sheet.bench.map((each) => each.player.name)).toEqual(["Kepa"]);
  });

  it("prints a surname without FPL's initial", () => {
    expect(printName(man("B.Fernandes:M:1").player)).toBe("Fernandes");
    expect(printName(man("E.Le Fée:M:1").player)).toBe("Le Fée");
    expect(printName(man("Saka:M:1").player)).toBe("Saka");
  });

  it("prints a man's first name as a paper does, and leaves a man known by one name alone", () => {
    const named = (name: string, fullName: string) => fullPrintName({ ...man(`${name}:M:1`).player, name, fullName });
    expect(named("B.Fernandes", "Bruno Borges Fernandes")).toBe("Bruno Fernandes");
    expect(named("E.Le Fée", "Enzo Le Fée")).toBe("Enzo Le Fée");
    expect(named("Vuskovic", "Luka Vušković")).toBe("Luka Vuskovic");
    expect(named("Rodri", "Rodrigo Hernández Cascante")).toBe("Rodri");
    expect(named("Gabriel", "Gabriel dos Santos Magalhães")).toBe("Gabriel");
    expect(named("George Hemmings", "George Hemmings")).toBe("George Hemmings");
  });
});

describe("debuts", () => {
  const before = side("a", XI, ["Eze:M:8", "Kepa:G:1"]);

  it("has nothing to say on a side's first sheet", () => {
    expect(debuts(before, [])).toBeNull();
  });

  it("names a man off the bench and a new signing, and nobody on an unchanged eleven", () => {
    const now = side("a", XI.map((spec) => (spec.startsWith("Palmer") ? "Eze:M:8" : spec.startsWith("Wood") ? "Ekitike:F:9" : spec)), ["Palmer:M:3", "Kepa:G:1"]);
    expect(debuts(now, [before])?.map((each) => each.player.name)).toEqual(["Eze", "Ekitike"]);
    expect(debuts(before, [before])).toEqual([]);
  });

  it("is no debut for a man who started for the side in any earlier round", () => {
    const earlier = side("a", ["Eze:M:8"]);
    const now = side("a", ["Eze:M:8"]);
    expect(debuts(now, [earlier, side("a", ["Rice:M:1"])])).toEqual([]);
  });
});
