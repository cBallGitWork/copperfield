import { describe, expect, it, vi } from "vitest";
import { draftPick } from "./Pedigree";

vi.mock("@/app/desk", () => import("../../desk"));

const drafted = (round: number, overall: number) => ({ origin: "draft" as const, round, overall, teamId: "t1", against: null });

describe("the draft pick", () => {
  it("names the overall pick and who made it, and never the round", () => {
    // The real draft's 11th name called was round 2's first pick, not its eleventh.
    expect(draftPick(drafted(2, 11), "Raccoons")).toBe("11th pick, by Raccoons");
  });

  it("loses the drafter when nobody can name him", () => {
    expect(draftPick(drafted(1, 2), null)).toBe("2nd pick");
  });
});
