import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// The /fpl strip stands above the pitch on a phone, so the pitch's budget must grow by the strip and the page's gap.
const css = (name: string) => readFileSync(join(__dirname, "..", name), "utf8");
const rem = (block: string, selector: string, prop: string) => {
  const body = block.slice(block.indexOf(`${selector} {`));
  const value = body.match(new RegExp(`${prop}:\\s*([\\d.]+)rem`))?.[1];
  return value === undefined ? NaN : Number(value);
};

describe("/fpl's phone pitch budget", () => {
  it("adds the compact strip and the page's 1rem gap to `.pitch-fpl`'s chrome", () => {
    const pitch = css("pitch.css");
    const base = rem(pitch, ".pitch-fpl", "--pitch-page");
    const phone = rem(pitch.slice(pitch.indexOf("@media (width < 64rem)")), ".fpl-views .pitch-fpl", "--pitch-page");
    const strip = rem(css("desk.css"), ".cm-tab-compact", "min-height");
    expect(phone).toBe(base + strip + 1);
  });

  it("marks the page only when it draws the strip, and puts the exits under the views on a phone", () => {
    const page = readFileSync(join(__dirname, "page.tsx"), "utf8");
    expect(page).toContain('entry.leagues.length > 0 ? "fpl-views" : ""');
    expect(page).toMatch(/className="[^"]*max-lg:order-last[^"]*">\s*<OutLink/);
  });
});
