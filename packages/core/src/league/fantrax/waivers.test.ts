import { describe, expect, it } from "vitest";
import { mapWaiverSchedule } from "./waivers";
import type { RawWaiverSettings } from "./waivers";
import settings from "./__fixtures__/waiverSettings.json";

// The real league's setup, 19 Oct 2026: claims resolve Wednesday, Thursday and Friday at 1:00 PM, Fantrax's clock.

const real = settings as RawWaiverSettings;

/** The real block with some fields swapped. */
function edited(fields: Record<string, unknown>): RawWaiverSettings {
  return { waiverWire: { ...real.waiverWire, ...fields } };
}

describe("mapWaiverSchedule", () => {
  it("reads the real league's three run days and its afternoon clock", () => {
    expect(mapWaiverSchedule(real)).toEqual({ weekdays: [3, 4, 5], hour: 13, minute: 0, timeZone: "America/New_York" });
  });

  // The rehearsal and dummy leagues run Tuesday and Friday at 5:00 AM: a league's own setting, never a constant.
  it("reads another league's days and a morning clock", () => {
    const rehearsal = edited({ waiverWireClaimResolutionDays: ["3", "6"], waiverWireClaimResolutionTimeHour: 5, waiverWireClaimResolutionTimeAmPm: "AM" });
    expect(mapWaiverSchedule(rehearsal)).toMatchObject({ weekdays: [2, 5], hour: 5, minute: 0 });
  });

  it("reads twelve on the clock as noon and midnight, not as 24 and 12", () => {
    expect(mapWaiverSchedule(edited({ waiverWireClaimResolutionTimeHour: 12, waiverWireClaimResolutionTimeAmPm: "PM" }))?.hour).toBe(12);
    expect(mapWaiverSchedule(edited({ waiverWireClaimResolutionTimeHour: 12, waiverWireClaimResolutionTimeAmPm: "AM" }))?.hour).toBe(0);
  });

  it("has no weekly run for a league that clears each man days after his drop", () => {
    expect(mapWaiverSchedule(edited({ waiverWireProcessType: "NUM_DAYS" }))).toBeNull();
  });

  it("refuses a block that does not read rather than guessing a day or a time", () => {
    expect(mapWaiverSchedule({})).toBeNull();
    expect(mapWaiverSchedule(edited({ waiverWireClaimResolutionDays: [] }))).toBeNull();
    expect(mapWaiverSchedule(edited({ waiverWireClaimResolutionDays: ["9", "x"] }))).toBeNull();
    expect(mapWaiverSchedule(edited({ waiverWireClaimResolutionTimeAmPm: undefined }))).toBeNull();
    expect(mapWaiverSchedule(edited({ waiverWireClaimResolutionTimeHour: 13 }))).toBeNull();
    expect(mapWaiverSchedule(edited({ waiverWireClaimResolutionTimeMinute: 60 }))).toBeNull();
  });
});
