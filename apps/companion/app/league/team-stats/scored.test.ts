import { describe, expect, it } from "vitest";
import { ASSISTS_OFFICIAL, ASSISTS_TOTAL, GOALS, GOALS_AGAINST, GROUPS, offeredIn, statCategory, type ScoringRules } from "@epl/core";
import { codesOf, scoredIn } from "./scored";

// The dummy league's own prices (getLeagueInfo, 30 Oct 2026): AT listed at nought for every slot, A and G paid.
const rules: ScoringRules = {
  goaliePosition: "G",
  goalie: { A: { Default: 3 }, G: { Default: 6 }, GA: { Default: -1 } },
  outfield: { AT: { D: 0, F: 0, G: 0, M: 0, Default: 0 }, A: { Default: 3 }, G: { D: 6, F: 4, M: 5, Default: 0 }, GAO: { D: -1, Default: 0 } },
};
const positions = ["G", "D", "M", "F"];
const attacking = [statCategory(GOALS, "attacking"), statCategory(ASSISTS_TOTAL, "attacking"), statCategory(ASSISTS_OFFICIAL, "attacking")];

describe("the categories a team stats board prices", () => {
  it("drops a category the league scores at nought at every position", () => {
    expect(scoredIn(attacking, rules, positions).map((category) => category.key)).toEqual([GOALS.caption, ASSISTS_OFFICIAL.caption]);
  });

  it("keeps goals against, paid to a keeper as GA and a defender as GAO", () => {
    const against = [statCategory(GOALS_AGAINST, "defensive")];
    expect(scoredIn(against, rules, positions)).toEqual(against);
  });

  it("keeps every category where the scoring is unread", () => {
    expect(scoredIn(attacking, null, positions)).toEqual(attacking);
  });

  it("knows the codes of every category the board can offer", () => {
    // A category with no codes is kept, so a new one on the board must be named in `scored.ts`.
    const all = GROUPS.flatMap((group) => offeredIn(group.key, new Map()));
    expect(all.filter((category) => codesOf(category).length === 0)).toEqual([]);
  });
});
