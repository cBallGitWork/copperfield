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
