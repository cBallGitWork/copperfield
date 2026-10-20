import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { FootballPlayer, PlayerOwner } from "@epl/core";
import { Goal, Man } from "./ScoreRows";

vi.mock("@/app/desk", () => ({ SMALL_CAPS: "" }));
vi.mock("./PlayerCardButton", () => ({
  MaybeCard: ({ className, children }: { className: string; children: ReactNode }) => createElement("span", { className }, children),
}));

const owners = new Map<number, PlayerOwner>([[7, { teamName: "Glengarry" } as PlayerOwner]]);

/** The class of the element whose text opens with `text`. */
function classOf(html: string, text: string): string {
  const at = html.indexOf(`>${text}`);
  return html.slice(html.lastIndexOf("<span", at), at).match(/class="([^"]*)"/)?.[1] ?? "";
}

describe("a scoresheet line on a phone", () => {
  // Review: at 390 'R. Sessegnon (Dome)' drew as 'R. Sessegn…', the man's own surname cut for his owner's.
  it("cuts the owner before the scorer's name", () => {
    const html = renderToStaticMarkup(
      createElement(Man, { code: 7, card: undefined, name: "Ryan Sessegnon", short: "Ryan Sessegnon", owners, figure: "90'" }),
    );
    expect(classOf(html, "(Glengarry)")).toContain("truncate");
    expect(classOf(html, "(Glengarry)")).toMatch(/shrink-\[/);
  });

  it("cuts the owner before the assister's name", () => {
    const assister = { code: 7, name: "Alex Iwobi", fullName: "Alex Iwobi" } as FootballPlayer;
    const html = renderToStaticMarkup(
      createElement(Goal, {
        group: { scorer: null, own: false, minutes: [10], assisters: [{ code: 7, minutes: [10] }] },
        owners, byCode: new Map([[7, assister]]), cards: new Map(),
      }),
    );
    expect(classOf(html, "(Glengarry)")).toContain("truncate");
    expect(classOf(html, "(Glengarry)")).toMatch(/shrink-\[/);
  });
});
