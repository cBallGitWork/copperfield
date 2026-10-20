import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { Club } from "@epl/core";
import ClubShell from "./Shell";
import PitchListStrip, { pitchListOf } from "./PitchList";

vi.mock("@/app/desk", () => import("../../../desk"));
vi.mock("@/app/components/shell/Link", () => ({ default: (props: object) => createElement("a", props) }));
vi.mock("../../../components/football/PhotoGround", () => ({ default: () => null }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ back: () => undefined }), usePathname: () => "/" }));

const club = { id: 14, code: 14, name: "Liverpool", shortName: "Liverpool" } as unknown as Club;
const strip = (view: "pitch" | "list") => createElement(PitchListStrip, { href: "/prem/club/14/depth", view });

describe("a club's Pitch | List", () => {
  it("opens on the tab's own view and reads only a known one from the query", () => {
    expect(pitchListOf(undefined, "pitch")).toBe("pitch");
    expect(pitchListOf("list", "pitch")).toBe("list");
    expect(pitchListOf("bogus", "list")).toBe("list");
  });

  it("is two links on ?view=, the current one marked, hidden on the desk", () => {
    const html = renderToStaticMarkup(strip("pitch"));
    expect(html).toMatch(/^<div class="lg:hidden"><nav aria-label="How to show the squad"/);
    expect(html).toMatch(/href="\/prem\/club\/14\/depth\?view=pitch"[^>]*aria-current="page"/);
    expect(html).toContain('href="/prem/club/14/depth?view=list"');
  });

  // Integration review, 20 Oct 2026: docked inside the panel it sat 20px narrower than Stats' strip and 190px above the rail at 320.
  it("docks as the club shell's foot, outside the plate, as club Stats' strip does", () => {
    const shell = { club, current: "depth" as const, foot: strip("pitch"), children: "BODY" };
    const html = renderToStaticMarkup(createElement(ClubShell, shell));
    const plateEnds = html.indexOf("BODY</div>") + "BODY</div>".length;
    expect(html.indexOf('<div class="sticky bottom-[var(--thumbrail)]')).toBe(plateEnds);
    expect(html.slice(plateEnds)).toContain('aria-label="How to show the squad"');
  });
});
