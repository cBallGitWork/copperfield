import { readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { pastMaps } from "./pastMaps";

const DIR = join(__dirname, "../../../data/intel/past-maps");
const seasons = readdirSync(DIR).map((file) => file.replace(/\.json$/, ""));
/** A man in every past file: five seasons in the league. */
const REGULAR = 17761;

describe("pastMaps", () => {
  // A file with no loader here would never be drawn; one off the heat grid would draw no touches.
  it("loads every season the script wrote, on the heat grid", async () => {
    expect(seasons.length).toBeGreaterThan(0);
    for (const season of seasons) {
      const maps = await pastMaps(season, REGULAR);
      expect(maps?.counts.size, season).toBeGreaterThan(0);
      expect(maps?.shots.length, season).toBeGreaterThan(0);
    }
  });

  it("has nothing for a man the file lacks", async () => {
    expect(await pastMaps(seasons[0], 0)).toEqual({ counts: new Map(), shots: [] });
  });

  it("has nothing for a season with no file, or none chosen", async () => {
    expect(await pastMaps("14-15", REGULAR)).toBeNull();
    expect(await pastMaps(null, REGULAR)).toBeNull();
  });
});
