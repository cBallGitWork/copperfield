import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";
import { CLUB_FPL_CODES, CREST_BASE, PL_ASSET_BASE, crestUrl, crestWatermarkUrl, politeFetch } from "@epl/core";
import { PUBLIC_ROOT } from "./paths";

// Every club's crest as our own PNGs, rasterised once from the Premier League's SVGs (one ran 189 KB).
// npm run crests, when the division changes, and commit what it writes.

/** 3x a 32px row crest; a 40px header takes 2x through next/image, and never asks for more. */
const ROW_PX = 96;

/** 3x the 128px card watermark, and the 2x of the 150px portrait's. */
const WATERMARK_PX = 384;

/** A crest is a few flat colours: a palette PNG is about a third of a full-colour one. */
const PALETTE = { palette: true, quality: 90, effort: 10, compressionLevel: 9 } as const;

const CLEAR = { r: 0, g: 0, b: 0, alpha: 0 };

/** Rendered at twice the target before the resize, so edges are averaged rather than sampled. */
async function raster(svg: Buffer, px: number, fit: "contain" | "inside"): Promise<Buffer> {
  const { width = px, height = px } = await sharp(svg).metadata();
  const density = (72 * 2 * px) / Math.max(width, height);
  return sharp(svg, { density }).resize(px, px, { fit, background: CLEAR }).png(PALETTE).toBuffer();
}

async function write(url: string, png: Buffer): Promise<void> {
  const path = join(PUBLIC_ROOT, url);
  await mkdir(join(path, ".."), { recursive: true });
  await writeFile(path, png);
}

async function main(): Promise<void> {
  for (const [shortName, code] of Object.entries(CLUB_FPL_CODES)) {
    const response = await politeFetch(`${PL_ASSET_BASE}/badges/t${code}.svg`);
    if (!response.ok) throw new Error(`${shortName}: the crest answered ${response.status}`);
    const svg = Buffer.from(await response.arrayBuffer());
    // A row's square box, as the SVG drew in it; the watermark keeps the crest's own shape for its `w-auto` frame.
    const row = await raster(svg, ROW_PX, "contain");
    const watermark = await raster(svg, WATERMARK_PX, "inside");
    await write(crestUrl({ code }), row);
    await write(crestWatermarkUrl({ code }), watermark);
    console.log(`${shortName} t${code}: svg ${svg.length} B, row ${row.length} B, watermark ${watermark.length} B`);
  }
  console.log(`Wrote ${Object.keys(CLUB_FPL_CODES).length} clubs under public${CREST_BASE}.`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
