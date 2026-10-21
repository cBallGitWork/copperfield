import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { Held } from "../../../../players/holder";
import TakerName from "./TakerName";

vi.mock("@/app/desk", () => import("../../../../desk"));
vi.mock("@/app/components/shell/Link", () => ({ default: (props: object) => createElement("a", props) }));

const render = (held: Held | undefined) =>
  renderToStaticMarkup(
    TakerName({ href: "/players/x", held, teamNames: new Map([["t2", "Second XI"]]), reader: "t1", children: "McGinn" }),
  );

describe("a set-piece taker's name", () => {
  // Review: the tag sat at the row's right edge; the boards print it straight after the name.
  it("prints the holder straight after the name, the name the one that grows no wider than it needs", () => {
    const html = render({ ownerTeamId: null, status: "FA" });
    expect(html).toMatch(/McGinn<\/a><span[^>]*>\(FA\)<\/span><\/span>$/);
    expect(html).not.toMatch(/<a[^>]*flex-1/);
  });

  it("tags the reader's own man Yours in the accent, a rival by his team", () => {
    expect(render({ ownerTeamId: "t1", status: "T" })).toMatch(/text-accent[^>]*>\(Yours\)/);
    expect(render({ ownerTeamId: "t2", status: "T" })).toContain("(Second XI)");
  });

  it("draws no tag for a man our league does not list", () => {
    expect(render(undefined)).not.toContain("(");
  });
});
