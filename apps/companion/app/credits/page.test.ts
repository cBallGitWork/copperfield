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
