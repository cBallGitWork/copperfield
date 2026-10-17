import { describe, expect, it } from "vitest";
import { worthOf } from "./__fixtures__/worth";
import { benchTurned, lateDecider } from "./__fixtures__/gw5";
import { contextOf } from "./__fixtures__/context";
import { draftMan } from "./__fixtures__/draftMan";
import { draftSide, eleven } from "./__fixtures__/draftSide";
import { pickAngle } from "./angle";
import { thread } from "./thread";
import { buildDraftBrief } from "./brief";
import { threadsOf } from "./threads";

const end = buildDraftBrief(5, [lateDecider(), benchTurned()]);

describe("buildDraftBrief", () => {
  it("never names a provider, a projection or an analyst's term", () => {
    for (const brief of [end]) for (const label of [/Fantrax/i, /\bFPL\b/, /project/i, /expected/i, /\bxG\b/, /%/, /\bbonus\b/i, /\brank\b/i]) expect(brief).not.toMatch(label);
  });

  it("builds each match-up on the desk's story: the result printed above, THE STORY for the lede, the twist, the cast", () => {
    expect(end).toContain("MATCH-UP 1: test2 v 123, THE LEAD");
    expect(end).toContain("THE RESULT, printed above your words, never in them: 123 beat test2 38-37.");
    expect(end).toContain("THE STORY, which your first sentence tells: 123: Haaland scored in the 81st minute; without that goal test2 would have won\n");
    expect(end).toContain("THE CAST, each man's points given once:\n- Man City's Haaland, for 123: 6 points: a goal in the 81st minute");
  });

  it("gives the returns biggest first and the automatic substitutions, never a day, a running score or a gap", () => {
    expect(end).toContain("THE RETURNS, biggest first:\n- 123's Haaland (a goal in the 81st minute)");
    expect(end).toContain("THE AUTOMATIC SUBSTITUTIONS:\n- Meunier came on for test2 in place of Millar, who did not play");
    expect(end).toContain("THE RETURNS, biggest first:\n- test3's Vuskovic (a clean sheet)");
    expect(end).not.toMatch(/Friday|Saturday|Sunday|Monday|making it|the gap|lead passing|led by|behind after|left out/u);
    // The only scores the brief gives are the results.
    expect([...end.matchAll(/\b\d{1,3}-\d{1,3}\b/gu)].map((m) => m[0]).sort()).toEqual(["33-28", "38-37"]);
  });

  it("names every return with its side, the biggest first, and never its points", () => {
    const saka = draftMan("Saka", "M", 8, 90, 0, { club: "Arsenal", goals: 1 });
    const rice = draftMan("Rice", "M", 5, 90, 0, { club: "Arsenal", assists: 1 });
    const ctx = contextOf(draftSide("A", 40, eleven("h", { 5: saka })), draftSide("B", 30, eleven("a", { 6: rice })));
    const angle = { story: thread("haul", { teamId: "A", men: [saka], facts: ["Saka scored"] }), twist: null, supporting: [], cast: [saka], score: 45, past: [] };
    expect(buildDraftBrief(5, [{ ...ctx, angle }])).toContain("THE RETURNS, biggest first:\n- A's Saka (a goal)\n- B's Rice (an assist)");
  });

  it("names the side a thread is about, so one side's blanks are never given to the other", () => {
    const arsenal = { 6: draftMan("Rice", "M", 1, 90, 0, { club: "Arsenal" }), 9: draftMan("Havertz", "F", 2, 90, 0, { club: "Arsenal" }) };
    const ctx = contextOf(draftSide("test2", 30, eleven("t", arsenal)), draftSide("123", 40, eleven("o")));
    expect(buildDraftBrief(5, [ctx])).toContain("test2: two Arsenal men, Rice and Havertz, both blanked\n");
  });

  it("leaves out where the sides stood, which the form strip prints, and meetings that are no thread", () => {
    expect(end).not.toMatch(/WHERE THEY STAND|THE MEETINGS/u);
  });

  it("says where each side goes next once the gameweek is done, and what each told last time", () => {
    const ctx = lateDecider();
    const angle = pickAngle(ctx, threadsOf(ctx, worthOf(), 5), [{ kind: "late-decider", family: "decider", teamIds: ["123", "test9"], cast: ["Haaland"] }]);
    const next = { home: { name: "test3", rank: 1 }, away: { name: "test4", rank: null } };
    const brief = buildDraftBrief(5, [{ ...ctx, angle, next }]);
    expect(brief).toContain("NEXT GAMEWEEK, for a last line that looks out:\n- test2 play test3, who are 1st after this gameweek\n- 123 play test4");
    expect(brief).toContain("LAST TIME, not to be told the same way again:\n- 123: a late decider, told through Haaland");
  });
});
