import { Children, isValidElement, type ReactElement, type ReactNode } from "react";
import { describe, expect, it } from "vitest";
import Link from "./Link";
import Pending from "./Pending";

describe("the app's Link", () => {
  // 16 Oct 2026: a tapped list row showed nothing for 0.7–1.3 s on a slow line, and a thumb that sees nothing taps again.
  it("carries the pending mark in every link, so a tapped row is drawn pressed until its page lands", () => {
    const link = Link({ href: "/players/04fk1", className: "cm-row", children: "Saka" }) as ReactElement<{ children: ReactNode }>;
    const last = Children.toArray(link.props.children).at(-1);
    expect(isValidElement(last) && last.type).toBe(Pending);
  });

  it("tells the back plate's trail a tab replaces its page rather than leaving it", () => {
    const tab = Link({ href: "/prem/match/81/players", replace: true, children: "Line-ups" }) as ReactElement<Record<string, unknown>>;
    const row = Link({ href: "/prem/match/81", children: "Arsenal v Spurs" }) as ReactElement<Record<string, unknown>>;
    expect(tab.props["data-replace"]).toBe("");
    expect(row.props["data-replace"]).toBeUndefined();
  });
});
