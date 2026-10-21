import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// Line-ups' pitch fills a phone under the page's chrome, so `--pitch-page` there is that chrome, summed from its parts.
const app = join(__dirname, "..", "..", "..");
const css = (name: string) => readFileSync(join(app, name), "utf8");
const here = (name: string) => readFileSync(join(__dirname, name), "utf8");
const rem = (block: string, selector: string, prop: string) => {
  const body = block.slice(block.indexOf(`${selector} {`));
  const value = body.match(new RegExp(`${prop}:\\s*([\\d.]+)rem`))?.[1];
  return value === undefined ? NaN : Number(value);
};
const phone = (sheet: string) => sheet.slice(sheet.indexOf("@media (width < 64rem)"));
const desk = (sheet: string) => sheet.slice(sheet.search(/@media \(min-width: 64rem\) \{\s*\.pitch-match \{/));
const MATCH = ".pitch-with-bench.pitch-match";

describe("the match pitch's phone budget", () => {
  it("is the chrome alone: bar, tabs, views strip, docked club switch, `--page-foot` and the four gaps", () => {
    const globals = css("globals.css");
    const tab = rem(css("desk.css"), ".cm-tab", "min-height");
    const compact = rem(css("desk.css"), ".cm-tab-compact", "min-height");
    const top = rem(globals, ":root", "--page-top");
    const foot = globals.match(/--page-foot: calc\(([\d.]+)rem \+ ([\d.]+)rem\)/)?.slice(1).map(Number) ?? [NaN, NaN];
    // `MatchBar`'s `min-h-16` plates, and `gap-2` in `FootFrame` and the shell's body.
    expect(here("MatchBar.tsx")).toContain("min-h-16");
    expect(here("Shell.tsx")).toContain('"flex flex-col gap-2"');
    const bar = 4;
    const gaps = 4 * 0.5;
    expect(rem(phone(css("pitch.css")), MATCH, "--pitch-page")).toBe(top + bar + tab + compact + tab + foot[0] + foot[1] + gaps);
  });

  it("keeps the desk's 19.5rem", () => {
    expect(rem(desk(css("pitch.css")), ".pitch-match", "--pitch-page")).toBe(19.5);
  });

  it("joins the filled phone sheet and keeps its own budget hook", () => {
    expect(here("MatchPitch.tsx")).toMatch(/<section\s+className=\{`[^`]*\bpitch-with-bench pitch-match\b/);
  });

  it("reserves one band and no strip number line, as the card and the strip draw", () => {
    const rule = phone(css("pitch.css")).slice(phone(css("pitch.css")).indexOf(`${MATCH} {`));
    expect(rule).toMatch(/--pitch-bands:\s*1;/);
    expect(rule).toMatch(/--pitch-strip-head:\s*0rem;/);
    const pitch = here("MatchPitch.tsx");
    expect(pitch).toContain('band=""');
    expect(pitch).toContain("numbered={false}");
  });

  it("sums every band through `--pitch-bands`, two by default, so no other pitch moves", () => {
    const sheet = css("pitch.css");
    expect(sheet).not.toMatch(/2 \* var\(--pitch-band\)/);
    expect(sheet.match(/var\(--pitch-bands, 2\)/g)?.length).toBe(4);
  });

  it("stands a face upright at the portrait file's 110x140", () => {
    expect(css("pitch.css")).toMatch(/\.pitch-match \{\s*--pitch-figure: 110 \/ 140;/);
  });

  it("docks a full-height club switch in Line-ups' foot", () => {
    const page = readFileSync(join(__dirname, "players", "page.tsx"), "utf8");
    expect(page).toMatch(/foot=\{\s*<>\s*<ClubSwitch/);
    expect(page.slice(page.indexOf("function ClubSwitch"))).not.toMatch(/^\s*compact\b/m);
  });
});
