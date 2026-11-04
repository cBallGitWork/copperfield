import { describe, expect, it } from "vitest";
import file from "../../../data/leagues/cup-seeds.json";
import { cupSeeds } from "./cupSeeds";

const named = file.seeds.flatMap((cup) => cup.teams.map((entry) => ({ teamId: entry.teamId, name: entry.seed })));

describe("cupSeeds", () => {
  it("lists each seeded cup's teams, the league's own, in seed order", () => {
    const seeds = cupSeeds([...named].reverse());
    expect(seeds.infusr?.map((team) => team.teamId)).toEqual(file.seeds[0]?.teams.map((entry) => entry.teamId));
  });

  it("seeds nothing for a league missing any of the file's teams", () => {
    expect(cupSeeds(named.slice(1))).toEqual({});
  });

  it("seeds every team once", () => {
    for (const cup of file.seeds) expect(new Set(cup.teams.map((entry) => entry.teamId)).size).toBe(cup.teams.length);
  });
});
