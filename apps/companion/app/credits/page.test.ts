import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { LABEL } from "../desk";
import { COLUMNISTS } from "../config";

vi.mock("next/navigation", () => ({ useRouter: () => ({}) }));
vi.mock("@/app/desk", () => import("../desk"));

import CreditsPage from "./page";

const html = renderToStaticMarkup(createElement(CreditsPage));
const entries = html.split("<li").slice(1);
const lawro = COLUMNISTS["Mark Lawrenson"]!.photo;

// M-PAPER-10 + M-SHELL-6: 4.86 screens at 390, each credit four lines under a five-line intro.
describe("the credits", () => {
  it("open on the list, with the Premier League's rights as one line at the foot", () => {
    expect(html).not.toContain("somebody else");
    const foot = html.lastIndexOf("Crests, kits and player portraits are the Premier League");
    expect(foot).toBeGreaterThan(html.lastIndexOf("</ul>"));
  });

  it("print each credit in two rows: the place, then title, author and licence", () => {
    for (const entry of entries) {
      const row = entry.slice(entry.indexOf("<div"));
      expect(entry.match(/<div/g)).toHaveLength(1);
      expect(entry.indexOf("<div")).toBeGreaterThan(entry.indexOf("</span>"));
      expect(row.match(/<a /g)).toHaveLength(2);
    }
    expect(html).not.toContain(LABEL);
  });

  it("link the photograph's title to its source and the licence to its terms, the BBC's still © BBC", () => {
    const bbc = entries.find((entry) => entry.includes(lawro.source))!;
    expect(bbc).toMatch(new RegExp(`href="${lawro.source}"[^>]*>${lawro.title}</a>`));
    expect(bbc).toMatch(new RegExp(`href="${lawro.licenceUrl}"[^>]*>© BBC</a>`));
    expect(bbc).toContain(lawro.author);
  });
});

// At 320 a wrapped credit cost a whole 44px line, and the dots in the author's span were stranded at the wrap.
describe("a credit's second row", () => {
  it("has no separator dots to strand: the gap alone parts title, author and licence", () => {
    for (const entry of entries) expect(entry.slice(entry.indexOf("<div"))).not.toContain("·");
  });

  it("wraps a line at the text's own height, the links' 44px reach held in by a negative margin", () => {
    for (const entry of entries) {
      const row = entry.slice(entry.indexOf("<div"));
      expect(row).toMatch(/<div class="[^"]*\bflex-wrap\b[^"]*\bleading-5\b/);
      for (const link of row.match(/<a [^>]*>/g)!) {
        expect(link).toMatch(/class="[^"]*-my-3 [^"]*\bpy-3\b/);
        expect(link).not.toContain("min-h-11");
      }
    }
  });
});

// F5: a short licence ("CC0", "© BBC") was a 24px-wide link under a thumb.
describe("a credit's licence link", () => {
  it("reaches the 44px tap floor however short its name, its reach held in by a negative margin", () => {
    for (const entry of entries) {
      const licence = entry.match(/<a [^>]*>/g)!.at(-1)!;
      expect(licence).toMatch(/class="[^"]*\bmin-w-11\b/);
      expect(licence).toMatch(/class="[^"]*-mx-2\.5 px-2\.5/);
    }
  });
});
