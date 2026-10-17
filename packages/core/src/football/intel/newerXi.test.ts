import { describe, expect, it } from "vitest";
import { newerElevens } from "./newerXi";
import type { IntelXi } from "./types";

const manifest = { season: "26-27", gameweek: 7, exportedAt: "2026-10-16T10:07:04Z", rows: 20, sources: [] };
const club = { formation: "4-2-3-1", slots: { "1": 1, "2": 4, "3": 2, "4": 3, "5": 1 }, starters: [] };

/** The build's copy, as `intel.ts` baked it at 10:07. */
const held: IntelXi = { manifest, fetchedAt: "2026-10-16T10:07:00Z", source: "rotowire", clubs: { ARS: club } };

describe("newerElevens", () => {
  it("takes the elevens read off the branch when they are newer than the build's", () => {
    const read = { ...held, fetchedAt: "2026-10-16T11:07:00Z", clubs: { ARS: { ...club, formation: "4-3-3" } } };
    expect(newerElevens(read, held)).toBe(read);
  });

  it("keeps the build's when the read is older, as a cached raw file can be just after a deploy", () => {
    expect(newerElevens({ ...held, fetchedAt: "2026-10-16T09:07:00Z" }, held)).toBe(held);
    expect(newerElevens({ ...held, fetchedAt: null }, held)).toBe(held);
  });

  it("keeps the build's for anything not shaped as the elevens", () => {
    for (const read of [null, "<!doctype html>", [], { clubs: {} }, { ...held, clubs: null }, { ...held, clubs: { ARS: { formation: "4-3-3" } } }, { ...held, fetchedAt: 7 }]) {
      expect(newerElevens(read, held)).toBe(held);
    }
  });
});
