import { describe, expect, it } from "vitest";
import { contextOf } from "./__fixtures__/context";
import { draftMan } from "./__fixtures__/draftMan";
import { draftSide, eleven } from "./__fixtures__/draftSide";
import { benchTurned, lateDecider } from "./__fixtures__/gw5";
import { worthOf } from "./__fixtures__/worth";
import { judgePage, pickAngle, type AngleRecord } from "./angle";
import { thread } from "./thread";
import { threadsOf } from "./threads";

const angleOf = (ctx = lateDecider(), past: AngleRecord[] = []) => pickAngle(ctx, threadsOf(ctx, worthOf(), 5), past);

describe("pickAngle", () => {
  it("tells GW5's late decider and the bench's turn, with no twist made of a day's lead", () => {
    const late = angleOf();
    expect([late?.story.kind, late?.twist, late?.cast.map((m) => m.name)[0]]).toEqual(["late-decider", null, "Haaland"]);
    const bench = angleOf(benchTurned());
    expect([bench?.story.kind, bench?.twist, bench?.cast.map((m) => m.name).slice(0, 2)]).toEqual(["bench-turned", null, ["Vuskovic", "Janelt"]]);
  });

  it("never spends a supporting thread on the margin, which the printed score already gives", () => {
    expect(angleOf()?.supporting.map((t) => t.family)).not.toContain("margin");
  });

  it("takes a twist with no day of its own when the story has none either", () => {
    const ctx = contextOf(draftSide("A", 40, eleven("h")), draftSide("B", 30, eleven("a")), { angle: null });
    const threads = [thread("close", { teamId: "A", facts: [], weight: 60 }), thread("bench-cost", { teamId: "B", facts: [], weight: 55 })];
    expect(pickAngle(ctx, threads, [])?.twist?.kind).toBe("bench-cost");
  });

  it("does not tell a side's story the same way twice running", () => {
    const past: AngleRecord[] = [{ kind: "late-decider", family: "decider", teamIds: ["test2", "123"], cast: ["Haaland"] }];
    expect(angleOf(lateDecider(), past)?.story.kind).toBe("close");
  });

  it("gives a family already leading the page way to another within fifteen, and keeps one far ahead", () => {
    const ctx = contextOf(draftSide("A", 40, eleven("h")), draftSide("B", 30, eleven("a")), { angle: null });
    const star = thread("haul", { teamId: "A", facts: [], weight: 50 });
    expect(pickAngle(ctx, [star, thread("late-goal", { teamId: "A", facts: [], weight: 40 })], [], new Set(["star"]))?.story.kind).toBe("late-goal");
    expect(pickAngle(ctx, [star, thread("late-goal", { teamId: "A", facts: [], weight: 30 })], [], new Set(["star"]))?.story.kind).toBe("haul");
  });

  // GW6 led an eight-point win on the loser's 1-point injury (Craig, 14 Oct 2026: "not a narrative").
  it("halves a setback that decided nothing, and tells a match-up with nothing over the floor as its result", () => {
    const ctx = contextOf(draftSide("A", 40, eleven("h")), draftSide("B", 30, eleven("a")), { angle: null });
    const injury = thread("injury", { teamId: "B", facts: [], weight: 50 });
    expect(pickAngle(ctx, [injury, thread("late-goal", { teamId: "A", facts: [], weight: 35 })], [])?.story.kind).toBe("late-goal");
    expect(pickAngle(ctx, [injury], [])).toBeNull();
    expect(pickAngle(ctx, [{ ...injury, decisive: true }], [])?.story.kind).toBe("injury");
  });

  it("finds the other side a place, and casts its top scorer", () => {
    const hall = draftMan("Hall", "D", 8, 90, 0, { club: "Newcastle" });
    const ctx = contextOf(draftSide("A", 40, eleven("h")), draftSide("B", 30, eleven("a", { 1: hall })), { angle: null });
    const ours = ["haul", "late-goal", "debut", "club-mates"] as const;
    const threads = [...ours.map((kind, i) => thread(kind, { teamId: "A", facts: [], weight: 80 - i * 10 })), thread("old-boy", { teamId: "B", facts: [], weight: 30 })];
    const angle = pickAngle(ctx, threads, []);
    expect(angle?.supporting.map((t) => t.kind)).toEqual(["late-goal", "debut", "old-boy"]);
    expect(angle?.cast.map((m) => m.name)).toContain("Hall");
  });
});

describe("judgePage", () => {
  it("leads with the strongest story", () => {
    const [late, bench] = [lateDecider(), benchTurned()];
    const page = judgePage([late, bench].map((ctx) => ({ ctx, threads: threadsOf(ctx, worthOf(), 5) })), []);
    expect(page.map((c) => c.angle?.story.kind)).toEqual(["bench-turned", "late-decider"]);
  });
});
