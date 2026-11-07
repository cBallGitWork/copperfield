import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// Two facts on one line are joined by core's PART_JOIN, so the desk's reskin changes the join in one place (DESIGN §10,
// 4). A ` · ` typed into a string or template here is a second copy the reskin would miss.

const APP = import.meta.dirname;
const TYPED = /" · "|' · '|[^/*\s] · \$\{|\} · [^\s*]/;
/** The browser tab's join, never drawn on the page. */
const ALLOWED = new Set([join(APP, "titles.ts")]);

function sources(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return entry.name === "node_modules" || entry.name.startsWith(".") ? [] : sources(path);
    return /\.tsx?$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name) ? [path] : [];
  });
}

describe("the join between two facts", () => {
  it("is PART_JOIN wherever the app sets one", () => {
    const typed = sources(APP)
      .filter((file) => !ALLOWED.has(file))
      .flatMap((file) =>
        readFileSync(file, "utf8")
          .split("\n")
          .filter((line) => !/^\s*(\/\/|\*|\/\*)/.test(line) && TYPED.test(line))
          .map((line) => `${file.slice(APP.length + 1)}: ${line.trim()}`),
      );
    expect(typed).toEqual([]);
  });
});
