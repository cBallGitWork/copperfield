// Shoots a design board (a self-contained HTML file, docs/design/boards/) at one width, the whole page,
// and says what a picture can't: which faces loaded, how tall the page is, and whether it scrolls
// sideways. The /design skill's camera; shot.mjs is the running app's. Needs headless Chrome on the
// CDP port, as every instrument here (/shoot, step 2).
//
//   node tools/ui/boardshot.mjs <board.html> <out.png> [--width 1440]

import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { DESK, connect, parseArgs } from "./cdp.mjs";

const { flags, positional } = parseArgs(process.argv.slice(2));
const [board, out] = positional;
const width = Number(flags.width ?? DESK.width);
if (!board || !out || !(width > 0)) {
  console.error(`usage: node tools/ui/boardshot.mjs <board.html> <out.png> [--width ${DESK.width}]`);
  process.exit(2);
}

// A file URL is the whole address, so the base the app's routes hang off is emptied.
process.env.BASE_URL = "";
const cdp = await connect();
await cdp.setViewport(width, DESK.height, 1);
await cdp.open(pathToFileURL(resolve(board)).href, 1500);
await cdp.js("document.fonts.ready.then(() => true)");
const report = await cdp.js(`({
  faces: [...new Set([...document.fonts].filter((f) => f.status === "loaded").map((f) => f.family + " " + f.weight))],
  height: document.documentElement.scrollHeight,
  sideways: document.documentElement.scrollWidth > innerWidth,
})`);
await cdp.setViewport(width, report.height, 1);
const shot = await cdp.send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true });
writeFileSync(out, Buffer.from(shot.data, "base64"));
cdp.close();

console.log(`${out} written (${width} x ${report.height})`);
console.log(`faces: ${report.faces.join(", ") || "none loaded"}`);
if (report.sideways) {
  console.error("scrolls sideways");
  process.exit(1);
}
