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

/** On a desk the name keeps its width and the owner gives it all: shrink weighted 999:1 still cut 'A. Iwo…' (review, 20 Oct). */
function expectOwnerYieldsFirst(html: string, short: string) {
  const name = nameClassOf(html, short).split(" ");
  const owner = classOf(html, "(Glengarry)").split(" ");
  expect(name).toEqual(expect.arrayContaining(["lg:shrink-0", "lg:max-w-full", "lg:truncate"]));
  expect(owner).toEqual(expect.arrayContaining(["lg:min-w-0", "lg:truncate", "whitespace-nowrap"]));
  expect(owner.some((cls) => cls.endsWith("shrink-0"))).toBe(false);
  // A phone breaks before the bracket whole, so it takes the next line or none, never a '(D…' stub beside the name.
  expect(html).toMatch(/ <span class="[^"]*">\(Glengarry\)/);
}

const sessegnon = (figure: string) =>
  renderToStaticMarkup(
    createElement(Man, { code: 7, card: undefined, name: "Ryan Sessegnon", short: "Ryan Sessegnon", owners, figure, glyph: "card" }),
  );

describe("a scoresheet line on a phone", () => {
  // Review: at 390 'R. Sessegnon (Dome)' drew as 'R. Sessegn…', the man's own surname cut for his owner's.
  it("cuts the owner before the scorer's name", () => {
    expectOwnerYieldsFirst(sessegnon("90'"), "R. Sessegnon");
  });

  // Review: 'R. Sesseg…' at text-lg on a 320 phone; type never shrinks (DESIGN 8), so the name takes a second line.
  it("wraps a scorer's long name rather than cutting it, and cuts it only on a desk", () => {
    const name = nameClassOf(sessegnon("90'"), "R. Sessegnon").split(" ");
    expect(name).not.toContain("truncate");
    expect(name).toContain("lg:truncate");
    expect(name).toContain("text-lg");
  });

  // Review: wrap-break-word split 'R.' / 'Sesseg' / 'non' at 320; a phone breaks only at a space.
  it("never splits a surname mid-word on a phone", () => {
    const name = nameClassOf(sessegnon("90'"), "R. Sessegnon").split(" ");
    for (const splits of ["wrap-break-word", "wrap-anywhere", "break-all"]) expect(name).not.toContain(splits);
  });

  // Final review (21 Oct): at 320 the card stood alone on line 1, the name on line 2 and '90+4′' on line 3.
  it("never wraps the row, so the icon stays beside the name", () => {
    const html = sessegnon("90+4");
    const row = html.match(/^<span class="([^"]*)"/)?.[1].split(" ") ?? [];
    expect(row.some((cls) => cls.includes("flex-wrap"))).toBe(false);
    expect(row).toEqual(expect.arrayContaining(["flex", "max-lg:items-start"]));
  });

  // The minute floats at the head of the name's block, so the name's second line runs under it, not under nothing.
  it("keeps the minute beside the name's first line, and last on a desk", () => {
    const html = sessegnon("90+4");
    const block = html.match(/<span class="([^"]*)"><span class="([^"]*)">90\+4<\/span>/);
    expect(block?.[1].split(" ")).toEqual(expect.arrayContaining(["flex-1", "lg:flex"]));
    expect(block?.[2].split(" ")).toEqual(expect.arrayContaining(["max-lg:float-right", "lg:order-last", "lg:ml-auto"]));
  });

  it("caps the name's block at two lines on a phone", () => {
    const block = sessegnon("90+4").match(/<span class="([^"]*)"><span class="[^"]*">90\+4</)?.[1].split(" ");
    expect(block).toEqual(expect.arrayContaining(["max-lg:max-h-[2lh]", "max-lg:overflow-hidden"]));
  });

  it("cuts the owner before the assister's name, and caps his line at two", () => {
    const assister = { code: 7, name: "Alex Iwobi", fullName: "Alex Iwobi" } as FootballPlayer;
    const html = renderToStaticMarkup(
      createElement(Goal, {
        group: { scorer: null, own: false, minutes: [10, 20], assisters: [{ code: 7, minutes: [10] }] },
        owners, byCode: new Map([[7, assister]]), cards: new Map(),
      }),
    );
    expectOwnerYieldsFirst(html, "A. Iwobi");
    expect(html).not.toContain("flex-wrap");
    const block = html.match(/<span class="([^"]*)"><span class="([^"]*)">10&#x27;<\/span>/);
    expect(block?.[1].split(" ")).toContain("max-lg:max-h-[2lh]");
    expect(block?.[2].split(" ")).toContain("max-lg:float-right");
  });
});
