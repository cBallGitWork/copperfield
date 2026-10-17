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
});
