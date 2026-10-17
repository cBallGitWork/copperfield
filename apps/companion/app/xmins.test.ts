import { describe, expect, it } from "vitest";
import { londonDayAndDate } from "@epl/core";
import { intelMinutesManifest } from "./intel";
import { minutesFrom } from "./xmins";

describe("minutesFrom", () => {
  // Mykolenko's 89 sat undated on Monday, Friday's figure under Sunday's news (review M23).
  it("dates every run with the day the model's export was taken", () => {
    const first = intelMinutesManifest.gameweek ?? 1;
    const [week] = minutesFrom(first)(null);
    expect(week?.asOf).toBe(londonDayAndDate(intelMinutesManifest.exportedAt));
  });
});
