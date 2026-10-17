import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { CLUB_FPL_CODES, crestUrl, crestWatermarkUrl } from "@epl/core";
import { PUBLIC_ROOT } from "./paths";

/** A PNG's width and height, off its IHDR chunk. */
function pngSize(url: string): { width: number; height: number } {
  const png = readFileSync(join(PUBLIC_ROOT, url));
  return { width: png.readUInt32BE(16), height: png.readUInt32BE(20) };
}

describe("committed crests", () => {
  // A club with no file draws a broken box in every row it appears in.
  it.each(Object.entries(CLUB_FPL_CODES))("%s has a square row crest and a watermark", (_shortName, code) => {
    expect(pngSize(crestUrl({ code }))).toEqual({ width: 96, height: 96 });
    const watermark = pngSize(crestWatermarkUrl({ code }));
    expect(Math.max(watermark.width, watermark.height)).toBe(384);
  });
});
