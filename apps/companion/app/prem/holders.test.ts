import { describe, expect, it } from "vitest";
import { holderOf } from "../players/holder";
import type { LeagueOpinion } from "./leagueOpinions";
import { teamNamesOf } from "./holders";

const man = (ownerTeamId: string | null, owner: string | null, status: string): LeagueOpinion => ({
  fantraxId: "x",
  positions: ["M"],
  status,
  ownerTeamId,
  owner,
});

describe("Prem holder tags", () => {
  const league = new Map([
    [1, man("t1", "Ctrl Alt Defeat", "T")],
    [2, man("t2", "Second XI", "T")],
    [3, man(null, null, "FA")],
    [4, man(null, null, "WW")],
  ]);

  it("names each holding team by its id, and only the teams that hold someone", () => {
    expect(teamNamesOf(league)).toEqual(
      new Map([
        ["t1", "Ctrl Alt Defeat"],
        ["t2", "Second XI"],
      ]),
    );
  });

  it("tags a free man with Fantrax's code, a held one with his team, and the reader's own as Yours", () => {
    const names = teamNamesOf(league);
    expect(holderOf(league.get(3)!, names, "t1")?.text).toBe("FA");
    expect(holderOf(league.get(4)!, names, "t1")?.text).toBe("WW");
    expect(holderOf(league.get(2)!, names, "t1")).toMatchObject({ text: "Second XI", tone: "rival" });
    expect(holderOf(league.get(1)!, names, "t1")).toMatchObject({ text: "Yours", tone: "yours" });
  });
});
