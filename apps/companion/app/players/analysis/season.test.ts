import { describe, expect, it } from "vitest";
import type { PastSeason } from "@epl/core";
import { lastSeason, pickedSeason, seasonName, shortSeason } from "./season";

function past(season: string): PastSeason {
  return { season, minutes: 900, goals: 1, assists: 0, cleanSheets: 0, goalsConceded: 0, yellowCards: 0, redCards: 0, saves: 0, fplPoints: 40 };
}

const CAREER = [past("2024/25"), past("2023/24")];

describe("the season parameter", () => {
  it("picks the season he played and nothing else", () => {
    expect(pickedSeason("2023-24", CAREER)?.season).toBe("2023/24");
    expect(pickedSeason("2019-20", CAREER)).toBeNull();
    expect(pickedSeason(undefined, CAREER)).toBeNull();
    expect(pickedSeason("2024-25", null)).toBeNull();
  });

  it("prints a season short after the name, and the bare name when it cannot", () => {
    expect(shortSeason("2024/25")).toBe("24/25");
    expect(shortSeason("2026-27")).toBe("26/27");
    expect(seasonName("Haaland", "2024/25")).toBe("Haaland 24/25");
    expect(seasonName("Haaland", null)).toBe("Haaland");
    expect(seasonName("Haaland", "this year")).toBe("Haaland");
  });

  it("offers his last season, or the one before when that is already on screen", () => {
    expect(lastSeason(CAREER, null)?.season).toBe("2024/25");
    expect(lastSeason(CAREER, "2024/25")?.season).toBe("2023/24");
    expect(lastSeason([], null)).toBeNull();
    expect(lastSeason(null, null)).toBeNull();
  });
});
