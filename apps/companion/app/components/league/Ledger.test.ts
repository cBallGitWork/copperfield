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

/** The words in the phone's two cells left of the names: row one beside In, row two beside Out. */
function cells(html: string): string[] {
  const at = (cell: string) => html.indexOf(`<span class="${cell}`);
  const words = (from: number, to: number) => html.slice(from, to).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return [words(at("col-start-1 row-start-1"), at("col-start-1 row-start-2")), words(at("col-start-1 row-start-2"), html.lastIndexOf("<", html.indexOf("col-start-2 row-start-1")))];
}

describe("a transfer under a thumb (Craig, 19 Oct 2026: two rows, not three)", () => {
  it("sets the league's date and type beside In, and whose move beside Out", () => {
    expect(cells(render())).toEqual(["Fri 16 Oct Waiver", "Beef Cowthenbeef"]);
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
    expect(cells(render(BEEF))).toEqual(["Fri 16 Oct", "Waiver"]);
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
    expect(cells(grouped())).toEqual(["Fri 16 Oct Waiver", "Beef Cowthenbeef"]);
    expect(grouped()).toMatch(/<span class="cm-index[^"]*hidden lg:block/);
  });

  // Final review (21 Oct 2026): grouping left-aligned the league's type, which sat right before the day heads.
  it("keeps the league's type at the right of its cell, and a team's at the left", () => {
    const kind = (html: string) => html.match(/<span class="([^"]*text-info[^"]*)">Waiver/)?.[1] ?? "";
    expect(kind(grouped())).toContain("ml-auto min-w-0 text-right lg:ml-0");
    expect(kind(render())).toContain("ml-auto min-w-0 text-right lg:ml-0");
    expect(kind(grouped(BEEF))).not.toContain("text-right");
  });

  it("sets a team's own type beside In, with nothing beside Out on a claim", () => {
    expect(cells(grouped(BEEF))).toEqual(["Fri 16 Oct Waiver", ""]);
  });

  // Final review (21 Oct 2026): 4.5rem cut RACCOONS to "RACCOO…" (plate 76px in 72); 5.25rem holds the longest short name.
  it("gives the league's left column the plate's room, and a team's the type alone", () => {
    expect(grouped()).toContain("grid-cols-[5.25rem_minmax(0,1fr)]");
    expect(grouped(BEEF)).toContain("grid-cols-[4rem_minmax(0,1fr)]");
    expect(render()).toContain("grid-cols-[6rem_minmax(0,1fr)]");
  });

  it("leaves an ungrouped ledger (Waivers' Last run) its per-row stamp and no headings", () => {
    expect(headings(render())).toEqual([]);
    expect(render()).not.toMatch(/<span class="cm-index[^"]*hidden lg:block/);
  });
});

describe("a name under a thumb", () => {
  const phone = (html: string) => html.match(/<span class="min-w-0 \[overflow-wrap:anywhere\] lg:hidden">(.*?)<\/span><span class="hidden/)?.[1] ?? "";

  it("wraps rather than cuts, and truncates only on a desk", () => {
    const html = render();
    expect(phone(html)).toMatch(/^Levi Colwil</);
    expect(html).toContain('<span class="hidden min-w-0 items-center gap-1.5 lg:flex"><span class="truncate">Levi Colwill</span>');
  });

  // Final review (21 Oct 2026): a plain space let '(D)' drop alone under the name, 40 of 86 at 320; an nbsp alone left
  // 'Gudmundsson (D)', wider than any 320 line, broken before the tag.
  it("ties the position to the name's last letter, so it never starts a line alone", () => {
    expect(phone(render())).toBe('Levi Colwil<span class="whitespace-nowrap">l\u00a0<span class="text-2xs font-bold text-mid lg:text-xs">(D)</span></span>');
    const accented: Deal = { ...WAIVER, inbound: [{ ...man("Mamadou Sangare\u0301", BEEF), position: "M" }] };
    const html = renderToStaticMarkup(createElement(Ledger, { deals: [accented], nameOf: named([]) }));
    expect(phone(html)).toMatch(/^Mamadou Sangar<span class="whitespace-nowrap">e\u0301\u00a0/);
  });

  it("leaves a name with no position whole, wrapping under a thumb and cut on a desk", () => {
    const bare: Deal = { ...WAIVER, inbound: [{ ...man("Levi Colwill", BEEF), position: null }] };
    const html = renderToStaticMarkup(createElement(Ledger, { deals: [bare], nameOf: named([]) }));
    expect(html).toContain('<span class="min-w-0 [overflow-wrap:anywhere] lg:truncate">Levi Colwill</span>');
  });
});
