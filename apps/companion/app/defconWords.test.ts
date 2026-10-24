import { describe, expect, it } from "vitest";
import type { LeagueScoring } from "@epl/core";
import { defConRenames, defConWords } from "./defconWords";

// Craig, 24 Oct 2026: "DC and DC+ means nothing, other players wouldn't know what that means". Named by who is paid.
const band = (from: number) => ({ bands: [{ from, to: null, points: 1, every: null }], cumulative: false });
const scoring = {
  rules: { goalie: {}, outfield: { DFP: { D: band(3), Default: 0 }, DFP3: { M: band(8), F: band(6), Default: 0 } }, goaliePosition: "G" },
  categories: {
    a: { code: "DFP", name: "Defensive Points", longCode: "INDIVIDUAL_DEFENSIVE_POINTS" },
    b: { code: "DFP3", name: "Defensive Points 3", longCode: "INDIVIDUAL_DEFENSIVE_POINTS_3" },
  },
} as unknown as LeagueScoring;

describe("defConWords", () => {
  it("heads each count by the positions the league pays on it, off its own prices", () => {
    const words = defConWords(scoring, ["G", "D", "M", "F"]);
    expect(words.get("DFP")).toEqual({ head: "DC D", name: "DefCon DEF", key: "DefCon DEF: tackles won, interceptions and blocks" });
    expect(words.get("DFP3")?.head).toBe("DC MF");
  });

  it("renames nothing where the league's scoring is unread", () => {
    expect(defConWords(null, ["D"]).size).toBe(0);
  });

  it("maps the static names to the league's, for a list built off them", () => {
    expect(defConRenames(defConWords(scoring, ["D", "M", "F"])).get("DefCon+")?.name).toBe("DefCon M/F");
  });
});
