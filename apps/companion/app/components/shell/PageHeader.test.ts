import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ back: vi.fn(), replace: vi.fn() }) }));
vi.mock("@/app/desk", () => import("../../desk"));

import PageHeader from "./PageHeader";
import PlateShell from "./PlateShell";
import SectionShell from "./SectionShell";
import { PINNED_TOP } from "../../desk";
import CreditsPage from "../../credits/page";

const BACK = 'aria-label="Back"';

// M11: /fpl, /credits and /squad, reached from More, had no way back but the bar.
describe("a title bar's back plate", () => {
  it("is drawn beside the bar when the page names where it goes", () => {
    expect(renderToStaticMarkup(createElement(PageHeader, { title: "FPL", back: "/more" }))).toContain(BACK);
  });

  it("is not drawn on a page that names none, as a tab's own", () => {
    expect(renderToStaticMarkup(createElement(PageHeader, { title: "FPL" }))).not.toContain(BACK);
  });

  it("is on the credits, a page behind More", () => {
    expect(renderToStaticMarkup(createElement(CreditsPage))).toContain(BACK);
  });
});

// Craig, 29 Oct 2026: on a phone a section's bar with its way back, and a subject's tabs, stay put down a long page.
describe("a phone's locked bars", () => {
  const pinnedTop = (html: string) => html.includes(`class="${PINNED_TOP}"`);

  it("locks a bar with a way back to the top, and leaves a tab's own bar in the flow", () => {
    expect(pinnedTop(renderToStaticMarkup(createElement(PageHeader, { title: "FPL", back: "/more" })))).toBe(true);
    expect(pinnedTop(renderToStaticMarkup(createElement(PageHeader, { title: "FPL" })))).toBe(false);
  });

  const shell = (phoneBar: boolean) => {
    const props = {
      colours: { primary: "#123456", secondary: "#ffffff" },
      title: "Arsenal",
      back: "/prem",
      phoneBar,
      tabs: createElement("nav", null, "views"),
      children: "body",
    };
    return renderToStaticMarkup(createElement(PlateShell, props));
  };

  it("docks a subject's tabs last, above the thumb rail", () => {
    expect(shell(true)).toMatch(/<div class="[^"]*\bmax-lg:order-last max-lg:sticky max-lg:bottom-\[var\(--thumbrail\)\][^"]*"><nav>views/);
  });

  it("locks nothing at the top when a phone draws no bar", () => {
    expect(pinnedTop(shell(false))).toBe(false);
    expect(shell(false)).not.toContain(BACK);
  });
});

describe("a section's tab strip on a phone", () => {
  // Craig, 29 Oct 2026, of League's LEAGUE · CUPS · FIXTURES strip: "lock these blue bars too".
  it("locks the tabs, and leaves the bar above and the banner under them to scroll", () => {
    const props = {
      header: createElement("h1", null, "League"),
      nav: createElement("nav", null, "views"),
      banner: createElement("aside", null, "waivers"),
      rows: 1,
      children: "body",
    };
    const html = renderToStaticMarkup(createElement(SectionShell, props));
    expect(html).toContain(`<h1>League</h1><div class="${PINNED_TOP}"><nav>views</nav></div><aside>waivers</aside>`);
  });
});
