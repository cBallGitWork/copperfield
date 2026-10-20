import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// Tailwind's scanner drops a class glued to `${`, so it never reaches the CSS.
const glued = /[^\s`{}]\$\{/;
const templates = (src: string) => src.match(/className=\{`[^`]*`\}/g) ?? [];

describe("the paper's class templates", () => {
  it("leave a space before every interpolation", () => {
    const bad = readdirSync(__dirname)
      .filter((f) => f.endsWith(".tsx"))
      .flatMap((f) => templates(readFileSync(join(__dirname, f), "utf8")).filter((t) => glued.test(t)).map((t) => `${f}: ${t}`));
    expect(bad).toEqual([]);
  });
});
