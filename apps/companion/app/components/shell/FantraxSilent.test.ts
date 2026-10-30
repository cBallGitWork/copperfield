import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import FantraxSilent from "./FantraxSilent";
import { UNAVAILABLE } from "../../config";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: () => {} }) }));
vi.mock("@/app/components/shell/Link", () => ({ default: (props: object) => createElement("a", props) }));

// 30 Oct 2026: /league ended on "Not available right now" and nothing to press, so a reader could only guess at a reload.
describe("a Fantrax that did not answer", () => {
  it("says so, and offers to ask again with a control a thumb can reach", () => {
    const html = renderToStaticMarkup(createElement(FantraxSilent, { code: "getStandings → TIMEOUT" }));
    expect(html).toContain(UNAVAILABLE);
    expect(html).toMatch(/<button[^>]*min-h-11[^>]*>Try again<\/button>/);
  });
});
