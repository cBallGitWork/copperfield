import { createElement, Fragment, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { Deal, DealSide } from "@epl/core";
import Ledger from "./Ledger";
import { named } from "../gazette/named";

vi.mock("next/image", () => ({ default: (props: object) => createElement("img", props) }));
vi.mock("@/app/desk", () => import("../../desk"));
vi.mock("@/app/components/shell/Link", () => ({ default: (props: object) => createElement("a", props) }));
vi.mock("@/app/teamColours", () => import("../../teamColours"));
vi.mock("@/app/teamNames", () => import("../../teamNames"));
vi.mock("@/app/players/routes", () => import("../../players/routes"));
vi.mock("./ScrollBoard", () => ({ default: ({ children }: { children: ReactNode }) => createElement(Fragment, null, children) }));

/** Cowthenbeef, whose short name is Beef. */
const BEEF = "7z8fy0pnmuogbtdw";

const man = (playerName: string, teamId: string | null): DealSide => ({ playerName, teamId, position: "D", club: "CHE" });

// Fantrax's stamp for Friday 16 October, US Eastern.
const WAIVER: Deal = {
  setId: "w1",
  kind: "claim",
  inbound: [man("Levi Colwill", BEEF)],
  outbound: [man("Harry Wilson", BEEF)],
  processedAt: "Fri Oct 16, 2026, 3:00AM",
  period: 7,
};

const render = (teamId?: string) =>
  renderToStaticMarkup(createElement(Ledger, { deals: [WAIVER], nameOf: named([{ teamId: BEEF, name: "Cowthenbeef" }]), ...(teamId ? { teamId } : {}) }));

/** The words in the phone's two cells between the date and the names: row one beside In, row two beside Out. */
function cells(html: string): string[] {
  const at = (cell: string) => html.indexOf(`<span class="${cell}`);
  const words = (from: number, to: number) => html.slice(from, to).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return [words(at("row-start-1 flex"), at("row-start-2 flex")), words(at("row-start-2 flex"), html.lastIndexOf("<", html.indexOf("lg:order-3")))];
}

/** The date block's classes, the first index block in the markup. */
const dateBlock = (html: string) => html.match(/<span class="(cm-index [^"]*)"/)?.[1] ?? "";

describe("a transfer under a thumb (Craig, 19 Oct 2026: two rows, not three)", () => {
  it("sets the league's type beside In and whose move beside Out, the date down the left of both", () => {
    expect(cells(render())).toEqual(["Waiver", "Beef Cowthenbeef"]);
  });

  // Design review (21 Oct 2026): the date sat 6px in and 4px off each rule, and filled row one only.
  it("runs the date block rule to rule against the row's left edge, its breathing room on the cells", () => {
    const html = render();
    expect(dateBlock(html).split(/\s+/)).toEqual(expect.arrayContaining(["cm-spine", "col-start-1", "row-start-1", "row-span-2"]));
    const row = html.match(/<li class="(cm-row [^"]*)"/)?.[1].split(/\s+/) ?? [];
    expect(row).toContain("grid-cols-[auto_5.25rem_minmax(0,1fr)]");
    expect(row.filter((name) => /^(px|pl|py|pt|pb)-/.test(name))).toEqual([]);
    expect(html.match(/max-lg:pt-1/g)).toHaveLength(2);
    expect(html.match(/max-lg:pb-1/g)).toHaveLength(2);
  });

  it("hides the weekday on the league's list, below the desk", () => {
    expect(render()).toContain('<span class="hidden lg:inline">Fri </span>16 Oct');
  });

  it("names a trade's partner as who he dealt with, apart from the mover's plate (UX-8)", () => {
    const TRUFFLES = "aekx2715mtzgcl3f";
    const trade: Deal = { ...WAIVER, setId: "t1", kind: "trade", inbound: [man("Jeremy Doku", BEEF), man("Eberechi Eze", TRUFFLES)], outbound: [] };
    const html = renderToStaticMarkup(createElement(Ledger, { deals: [trade], nameOf: named([{ teamId: BEEF, name: "Cowthenbeef" }, { teamId: TRUFFLES, name: "The Truffle Pigs" }]) }));
    expect(cells(html)[1]).toBe("Beef Cowthenbeef With Truffles The Truffle Pigs");
  });

  it("still says Unknown for a manager the league no longer lists", () => {
    expect(renderToStaticMarkup(createElement(Ledger, { deals: [WAIVER], nameOf: named([]) }))).toContain(">Unknown<");
  });

  it("keeps a team's own date over its type, weekday and all", () => {
    expect(cells(render(BEEF))).toEqual(["Waiver", ""]);
    expect(render(BEEF)).toContain('<span class="">Fri </span>16 Oct');
  });
});

// Review SHELL-1 and LEAGUE-6 (20 Oct 2026): desk names at 24px under the row's 28 floor, and plates cut at 128px.
describe("a transfer on a desk", () => {
  it("holds every name, linked or not, to the desk row's 28px floor", () => {
    const linked: Deal = { ...WAIVER, inbound: [{ ...man("Levi Colwill", BEEF), fantraxId: "p1" }] };
    const html = renderToStaticMarkup(createElement(Ledger, { deals: [linked], nameOf: named([{ teamId: BEEF, name: "Cowthenbeef" }]) }));
    expect(html.match(/<a [^>]*class="[^"]*lg:min-h-7/g)).toHaveLength(1);
    expect(html.match(/<span class="[^"]*lg:min-h-7/g)).toHaveLength(1);
  });

  it("lets a long team name wrap in its plate rather than cut", () => {
    expect(render()).toContain("lg:line-clamp-2 lg:whitespace-normal");
  });
});

// Review M-LEAGUE-2 and M-SQUADS-5 (20 Oct 2026): the same date printed on every row, and names cut at 320.
describe("a ledger grouped by day under a thumb", () => {
  const THURSDAY: Deal = { ...WAIVER, setId: "w0", via: "free agency", processedAt: "Thu Oct 15, 2026, 3:00AM" };
  const SECOND: Deal = { ...WAIVER, setId: "w2", processedAt: "Fri Oct 16, 2026, 1:00PM" };
  const grouped = (teamId?: string) =>
    renderToStaticMarkup(
      createElement(Ledger, { deals: [SECOND, WAIVER, THURSDAY], groupByDay: true, nameOf: named([{ teamId: BEEF, name: "Cowthenbeef" }]), ...(teamId ? { teamId } : {}) }),
    );
  const headings = (html: string) => [...html.matchAll(/<li class="[^"]*lg:hidden[^"]*">([^<]*)<\/li>/g)].map((m) => m[1]);

  it("heads each London day once, weekday and all, below the desk only", () => {
    expect(headings(grouped())).toEqual(["Fri 16 Oct", "Thu 15 Oct"]);
    expect(headings(grouped(BEEF))).toEqual(["Fri 16 Oct", "Thu 15 Oct"]);
  });

  it("sets the league's type alone beside In, and whose move beside Out", () => {
    expect(cells(grouped())).toEqual(["Waiver", "Beef Cowthenbeef"]);
    expect(dateBlock(grouped())).toContain("hidden lg:flex");
  });

  // Final review (21 Oct 2026): grouping left-aligned the league's type, which sat right before the day heads.
  it("keeps the league's type at the right of its cell, and a team's at the left", () => {
    const kind = (html: string) => html.match(/<span class="([^"]*text-info[^"]*)">Waiver/)?.[1] ?? "";
    expect(kind(grouped())).toContain("ml-auto min-w-0 text-right lg:ml-0");
    expect(kind(render())).toContain("ml-auto min-w-0 text-right lg:ml-0");
    expect(kind(grouped(BEEF))).not.toContain("text-right");
  });

  it("sets a team's own type beside In, with nothing beside Out on a claim", () => {
    expect(cells(grouped(BEEF))).toEqual(["Waiver", ""]);
  });

  // Final review (21 Oct 2026): 4.5rem cut RACCOONS to "RACCOO…" (plate 76px in 72); 5.25rem holds the longest short name.
  it("gives the league's left column the plate's room, and a team's the type alone", () => {
    expect(grouped()).toContain("grid-cols-[5.25rem_minmax(0,1fr)]");
    expect(grouped(BEEF)).toContain("grid-cols-[4rem_minmax(0,1fr)]");
    expect(render()).toContain("grid-cols-[auto_5.25rem_minmax(0,1fr)]");
    expect(grouped()).toContain("pl-1.5");
  });

  it("leaves an ungrouped ledger (Waivers' Last run) its per-row stamp and no headings", () => {
    expect(headings(render())).toEqual([]);
    expect(dateBlock(render())).not.toContain("hidden");
  });
});

describe("a name under a thumb", () => {
  const phone = (html: string) => html.match(/<span class="min-w-0 \[overflow-wrap:anywhere\] lg:hidden">(.*?)<\/span><span class="hidden/)?.[1] ?? "";
  const TAG = 'text-2xs font-bold uppercase text-faint shrink-0';

  // UI audit D-12 (21 Oct 2026): the one list name, I. Surname under a thumb and in full on a desk, as PlayerName.
  it("initials the forename under a thumb, wraps rather than cuts, and truncates the full name only on a desk", () => {
    const html = render();
    expect(phone(html)).toMatch(/^L\. Colwil</);
    expect(html).toContain('<span class="hidden min-w-0 items-baseline gap-1.5 lg:flex"><span class="truncate">Levi Colwill</span>');
  });

  // UI audit D-13 (21 Oct 2026): "(D)" in its own ink beside DEF on every board lead; one caps label, one vocabulary.
  it("prints the position as the board leads' caps label, DEF or M/F, never a bracketed letter", () => {
    const html = render();
    expect(html).toContain(`<span class="${TAG}">DEF</span>`);
    expect(html).not.toContain("(D)");
    const dual: Deal = { ...WAIVER, inbound: [{ ...man("Bukayo Saka", BEEF), position: "F,M" }] };
    expect(renderToStaticMarkup(createElement(Ledger, { deals: [dual], nameOf: named([]) }))).toContain(`<span class="${TAG}">M/F</span>`);
  });

  // Final review (21 Oct 2026): a plain space let the tag drop alone under the name, 40 of 86 at 320; an nbsp alone left
  // 'Gudmundsson (D)', wider than any 320 line, broken before the tag.
  it("ties the position to the name's last letter, so it never starts a line alone", () => {
    expect(phone(render())).toBe(`L. Colwil<span class="whitespace-nowrap">l\u00a0<span class="${TAG}">DEF</span></span>`);
    const accented: Deal = { ...WAIVER, inbound: [{ ...man("Mamadou Sangare\u0301", BEEF), position: "M" }] };
    const html = renderToStaticMarkup(createElement(Ledger, { deals: [accented], nameOf: named([]) }));
    expect(phone(html)).toMatch(/^M\. Sangar<span class="whitespace-nowrap">e\u0301\u00a0/);
  });

  it("leaves a name with no position whole, initialled under a thumb and cut on a desk", () => {
    const bare: Deal = { ...WAIVER, inbound: [{ ...man("Levi Colwill", BEEF), position: null }] };
    const html = renderToStaticMarkup(createElement(Ledger, { deals: [bare], nameOf: named([]) }));
    expect(html).toContain('<span class="min-w-0 [overflow-wrap:anywhere] lg:truncate"><span class="lg:hidden">L. Colwill</span><span class="hidden lg:inline">Levi Colwill</span></span>');
  });
});
