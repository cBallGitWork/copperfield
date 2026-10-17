import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ back: vi.fn(), replace: vi.fn() }) }));
vi.mock("@/app/desk", () => import("../../desk"));

import PageHeader from "./PageHeader";
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
