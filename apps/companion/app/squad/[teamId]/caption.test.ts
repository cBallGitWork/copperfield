import { describe, expect, it } from "vitest";
import type { SquadDetailLine, SquadPlayerDetail } from "@epl/core";
import { sheetCaption } from "./caption";

const man = (points: number | null | undefined) => ({ points }) as SquadPlayerDetail;
const line = (...points: (number | null | undefined)[]): SquadDetailLine => ({ position: "M", players: points.map(man) });

describe("sheetCaption", () => {
  it("prints a played week's number and what the eleven scored (your GW6, 43)", () => {
    expect(sheetCaption([line(2), line(6, 1, 9, 3), line(5, 2, 0, 8), line(4, 3)], 6)).toBe("Gameweek 6 · 43");
  });

  it("counts a nought and skips a man with no reading", () => {
    expect(sheetCaption([line(0, null, 7)], 6)).toBe("Gameweek 6 · 7");
  });

  it("prints a dash before anyone has a reading", () => {
    expect(sheetCaption([line(null, undefined)], 7)).toBe("Gameweek 7 · —");
  });

  it("keeps the side as it stands for a week still to play", () => {
    expect(sheetCaption([line(4)], null)).toBe("First-choice XI");
  });
});
