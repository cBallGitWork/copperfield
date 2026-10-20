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

/** The class of the span holding a phone's initialled name. */
function nameClassOf(html: string, short: string): string {
  return html.match(new RegExp(`<span class="([^"]*)"><span class="lg:hidden">${short}<`))?.[1] ?? "";
}

/** The name keeps its width and the owner gives it all: shrink weighted 999:1 still cut 'A. Iwo…' (review, 20 Oct). */
function expectOwnerYieldsFirst(html: string, short: string) {
  const name = nameClassOf(html, short).split(" ");
  const owner = classOf(html, "(Glengarry)").split(" ");
  expect(name).toEqual(expect.arrayContaining(["shrink-0", "max-w-full", "lg:truncate"]));
  expect(owner).toEqual(expect.arrayContaining(["min-w-0", "truncate"]));
  expect(owner).not.toContain("shrink-0");
}

describe("a scoresheet line on a phone", () => {
  // Review: at 390 'R. Sessegnon (Dome)' drew as 'R. Sessegn…', the man's own surname cut for his owner's.
  it("cuts the owner before the scorer's name", () => {
    const html = renderToStaticMarkup(
      createElement(Man, { code: 7, card: undefined, name: "Ryan Sessegnon", short: "Ryan Sessegnon", owners, figure: "90'" }),
    );
    expectOwnerYieldsFirst(html, "R. Sessegnon");
  });

  // Review: 'R. Sesseg…' at text-lg on a 320 phone; type never shrinks (DESIGN 8), so the name takes a second line.
  it("wraps a scorer's long name rather than cutting it, and cuts it only on a desk", () => {
    const html = renderToStaticMarkup(
      createElement(Man, { code: 7, card: undefined, name: "Ryan Sessegnon", short: "Ryan Sessegnon", owners, figure: "90'" }),
    );
    const name = nameClassOf(html, "R. Sessegnon").split(" ");
    expect(name).not.toContain("truncate");
    expect(name).toContain("lg:truncate");
    expect(name).toContain("text-lg");
  });

  // Review: wrap-break-word split 'R.' / 'Sesseg' / 'non' at 320; a phone breaks at the space, and a lone overlong word ends '…'.
  it("never splits a surname mid-word on a phone", () => {
    const html = renderToStaticMarkup(
      createElement(Man, { code: 7, card: undefined, name: "Ryan Sessegnon", short: "Ryan Sessegnon", owners, figure: "90'" }),
    );
    const name = nameClassOf(html, "R. Sessegnon").split(" ");
    for (const splits of ["wrap-break-word", "wrap-anywhere", "break-all"]) expect(name).not.toContain(splits);
    expect(name).toEqual(expect.arrayContaining(["overflow-hidden", "text-ellipsis"]));
  });

  // Review: 'R. Sessegnon' squeezed to 64px beside '90+4′' at 320; the minute takes the next line instead.
  it("drops the minute under a long name on a phone, sized by the name and not the owner", () => {
    const html = renderToStaticMarkup(
      createElement(Man, { code: 7, card: undefined, name: "Ryan Sessegnon", short: "Ryan Sessegnon", owners, figure: "90+4" }),
    );
    expect(html.match(/^<span class="([^"]*)"/)?.[1].split(" ")).toContain("max-lg:flex-wrap");
    const block = html.match(/<span class="([^"]*)"><span class="[^"]*"><span class="lg:hidden">R\. Sessegnon</)?.[1];
    expect(block?.split(" ")).toContain("max-lg:basis-auto");
    expect(classOf(html, "(Glengarry)").split(" ")).toEqual(expect.arrayContaining(["max-lg:w-0", "max-lg:grow"]));
    expect(classOf(html, "90+4").split(" ")).toContain("ml-auto");
  });

  it("cuts the owner before the assister's name", () => {
    const assister = { code: 7, name: "Alex Iwobi", fullName: "Alex Iwobi" } as FootballPlayer;
    const html = renderToStaticMarkup(
      createElement(Goal, {
        group: { scorer: null, own: false, minutes: [10], assisters: [{ code: 7, minutes: [10] }] },
        owners, byCode: new Map([[7, assister]]), cards: new Map(),
      }),
    );
    expectOwnerYieldsFirst(html, "A. Iwobi");
  });
});
