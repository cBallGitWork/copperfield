import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// Line-ups docks the club switch under a phone's pitch, so the grass's budget grows by one full plate.
const app = join(__dirname, "..", "..", "..");
const css = (name: string) => readFileSync(join(app, name), "utf8");
const rem = (block: string, selector: string, prop: string) => {
  const body = block.slice(block.indexOf(`${selector} {`));
  const value = body.match(new RegExp(`${prop}:\\s*([\\d.]+)rem`))?.[1];
  return value === undefined ? NaN : Number(value);
};

describe("the match pitch's phone budget", () => {
  it("adds the docked club switch (a full `.cm-tab`) to the 23rem measured on 23 Sep 2026", () => {
    const phone = rem(css("pitch.css"), ".pitch-match", "--pitch-page");
    const plate = rem(css("desk.css"), ".cm-tab", "min-height");
    expect(phone).toBe(23 + plate);
  });

  it("docks a full-height club switch in Line-ups' foot", () => {
    const page = readFileSync(join(__dirname, "players", "page.tsx"), "utf8");
    expect(page).toMatch(/foot=\{\s*<>\s*<ClubSwitch/);
    expect(page.slice(page.indexOf("function ClubSwitch"))).not.toMatch(/^\s*compact\b/m);
  });
});
