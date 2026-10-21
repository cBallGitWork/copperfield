import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { DepthSpot, FootballPlayer } from "@epl/core";
import DepthList from "./DepthList";
import DepthPitch from "./DepthPitch";
import type { WeekMinutes } from "./XMins";

vi.mock("@/app/desk", () => import("../../../../desk"));
vi.mock("@/app/components/shell/Link", () => ({ default: (props: object) => createElement("a", props) }));

const man = (code: number, name: string) =>
  ({ id: code, code, name, fullName: name, firstName: "", secondName: name, status: "a", news: "", chanceOfPlaying: null }) as unknown as FootballPlayer;
const men = new Map([1, 2, 3].map((code) => [code, man(code, ["Saka", "Nwaneri", "Sterling"][code - 1])]));
// Saka holds two shirts; Nwaneri's reading is nought; Sterling has none.
const lines: DepthSpot[][] = [
  [
    { slot: "RW", label: "Right wing", holders: [{ code: 1, share: 0.9 }, { code: 2, share: 0.1 }, { code: 3, share: 0 }] },
    { slot: "ST", label: "Striker", holders: [{ code: 1, share: 0.5 }] },
  ],
];
const week: WeekMinutes = { gameweek: 8, byCode: new Map([[1, 84], [2, 0], [3, null]]) };

const draw = (view: typeof DepthList | typeof DepthPitch, minutes: WeekMinutes | null) =>
  renderToStaticMarkup(createElement(view, { lines, playerOf: (code: number) => men.get(code) ?? null, cardOf: () => undefined, minutes }));

describe.each([
  ["pitch", DepthPitch],
  ["list", DepthList],
] as const)("the depth %s's xMins", (_, view) => {
  it("prints each man's figure for the gameweek, again at his second shirt", () => {
    const html = draw(view, week);
    expect(html.match(/title="Expected minutes, gameweek 8"[^>]*>84</g)).toHaveLength(2);
  });

  it("prints a nought as 0 and no reading as a dash", () => {
    const html = draw(view, week);
    expect(html).toMatch(/title="Expected minutes, gameweek 8"[^>]*>0</);
    expect(html).toMatch(/title="Expected minutes, gameweek 8"[^>]*>—</);
  });

  it("draws no figure when the export does not cover the week", () => {
    const html = draw(view, null);
    expect(html).not.toContain("Expected minutes");
    expect(html).not.toContain("text-info");
  });
});

describe("a pitch plate's line", () => {
  // DESIGN §9: the plate must not grow, so the name gives way and the figure stays on its line.
  it("keeps the name and the figure on one line, the name truncating", () => {
    const html = draw(DepthPitch, week);
    const line = html.match(/<span class="([^"]*)"><span class="([^"]*)">Saka<\/span><span class="([^"]*)"/);
    expect(line).not.toBeNull();
    const [, row, name, figure] = line!;
    expect(row).toMatch(/\bflex\b/);
    expect(row).not.toMatch(/flex-col|flex-wrap/);
    expect(row).toContain("text-2xs");
    expect(name).toContain("truncate");
    expect(figure).toContain("shrink-0");
  });
});
