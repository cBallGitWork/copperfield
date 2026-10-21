import { describe, expect, it } from "vitest";
import { seasonClubCode } from "./seasonClub";

const clubs = [
  { name: "Man City", shortName: "MCI" },
  { name: "Spurs", shortName: "TOT" },
  { name: "Everton", shortName: "EVE" },
];

describe("seasonClubCode", () => {
  it("finds the code by the store's full name, whatever FPL calls the club", () => {
    expect(seasonClubCode("Manchester City", clubs)).toBe("MCI");
    expect(seasonClubCode("Tottenham Hotspur", clubs)).toBe("TOT");
    expect(seasonClubCode("Everton", clubs)).toBe("EVE");
  });

  it("has none for a club not in the league now", () => {
    expect(seasonClubCode("Watford", clubs)).toBeNull();
  });
});
