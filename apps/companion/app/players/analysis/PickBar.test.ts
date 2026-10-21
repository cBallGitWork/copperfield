import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { DATA_COMPARE, playerCompare } from "./compareRoute";

// The app's `@/` alias is Next's, not vitest's: the link and the client search box are stand-ins.
vi.mock("@/app/desk", () => import("../../desk"));
vi.mock("@/app/components/shell/Link",() => ({ default: (props: object) => createElement("a", props) }));
vi.mock("./PickField", () => ({
  default: ({ side, action, children }: { side: string; action: string; children: ReactNode }) =>
    createElement("form", { "data-side": side, action }, children),
}));

import PickBar, { pickHref } from "./PickBar";

const A = { chosen: "061vq", typed: "", name: "Haaland", season: undefined };
const B = { chosen: "061vq", typed: "", name: "Haaland 25/26", season: "2025-26" };

const draw = (route: Parameters<typeof PickBar>[0]["route"]) => renderToStaticMarkup(createElement(PickBar, { rows: [], a: A, b: B, route }));

describe("Compare's search boxes", () => {
  it("draws only B's box on his own Compare, posting back to it without an A", () => {
    const html = draw(playerCompare("061vq"));
    expect([...html.matchAll(/data-side="(\w)"/g)].map((side) => side[1])).toEqual(["b"]);
    expect(html).toContain('action="/players/061vq/compare"');
    expect(html).not.toContain('name="a"');
    // Over B's half of the bar, as it is with both boxes.
    expect(html).toMatch(/^<div class="grid grid-cols-2[^"]*"><div class="[^"]*col-start-2"><form data-side="b"/);
  });

  it("keeps both boxes on Data's Compare, each carrying the other man", () => {
    const html = draw(DATA_COMPARE);
    expect([...html.matchAll(/data-side="(\w)"/g)].map((side) => side[1])).toEqual(["a", "b"]);
    expect(html).toContain('name="a" value="061vq"');
  });

  it("swaps B on his own Compare and keeps his season", () => {
    expect(pickHref("b", "04ab1", { ...A, season: "2023-24" }, playerCompare("061vq"))).toBe("/players/061vq/compare?b=04ab1&as=2023-24");
    expect(pickHref("b", "04ab1", A, DATA_COMPARE)).toBe("/players/analysis?b=04ab1&a=061vq");
  });
});
