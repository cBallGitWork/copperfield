import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import WeekStrip from "./WeekStrip";

vi.mock("@/app/desk", () => import("../../desk"));

const strip = (props: Partial<Parameters<typeof WeekStrip>[0]>) =>
  renderToStaticMarkup(createElement(WeekStrip, { form: [], next: [], asOf: null, ...props }));

describe("a card's form and run", () => {
  const html = strip({
    form: [
      { fixtureId: 1, gameweek: 5, opponent: "ARS", home: true, points: 6 },
      { fixtureId: 2, gameweek: 6, opponent: "SUN", home: false, points: 0 },
      { fixtureId: 3, gameweek: 7, opponent: "CRY", home: true, points: null },
    ],
    next: [
      { key: "a", gameweek: 8, against: { shortName: "LIV", home: false, difficulty: 4 }, minutes: 85 },
      { key: "b", gameweek: 9, against: { shortName: "MCI", home: false, difficulty: 5 }, minutes: 30 },
      { key: "c", gameweek: 9, against: { shortName: "BRE", home: true, difficulty: 3 } },
    ],
    asOf: "Thu 22 Oct",
  });

  it("prints each recent opponent and venue over our league's points, in the reading's cyan", () => {
    expect(html).toMatch(/>ARS<\/span><span[^>]*>H</);
    expect(html).toMatch(/text-info"[^>]*>6</);
    // A man who played prints his nought; one who did not is a dash.
    expect(html).toMatch(/text-info"[^>]*>0</);
    expect(html).toMatch(/text-info"[^>]*>—</);
  });

  it("heads every week, past and to come, with the table's bevelled gameweek plate", () => {
    expect(html.match(/class="cm-bevel flex h-6[^"]*text-3xs font-bold uppercase"[^>]*>GW\d+</g)).toHaveLength(6);
  });

  it("draws a played match on the plain plate: FPL's difficulty never sits beside the league's points", () => {
    for (const club of ["ARS", "SUN", "CRY"]) expect(html).toMatch(new RegExp(`var\\(--color-raised\\)"><span[^>]*>${club}<`));
    expect(html).toMatch(/var\(--color-fdr-4\)"><span[^>]*>LIV</);
  });

  it("names each figure row in a leading column, as the Profile's run does", () => {
    const words = [...html.matchAll(/<li class="flex shrink-0[^"]*">[\s\S]*?<span class="[^"]*text-faint">([^<]+)</g)];
    expect(words.map((word) => word[1])).toEqual(["FPts", "xMins"]);
  });

  it("parts Form from Next as two blocks, each with its own head", () => {
    const blocks = html.match(/<section[^>]*>[\s\S]*?<\/section>/g) ?? [];
    expect(blocks).toHaveLength(2);
    expect(blocks[0]).toContain(">Form<");
    expect(blocks[0]).not.toContain(">Next<");
    expect(blocks[1]).toMatch(/^<section[^>]*><p[^>]*><span[^>]*>Next</);
  });

  it("draws each fixture on its difficulty with his xMins inked under the week's first match", () => {
    expect(html).toContain("var(--color-fdr-4)");
    expect(html).toMatch(/text-info"[^>]*>85</);
    expect(html).toMatch(/text-bad"[^>]*>30</);
    expect(html.match(/title="Expected minutes/g)).toHaveLength(2);
    expect(html).toContain("xMins Thu 22 Oct");
  });

  it("prints a dash for a man with no matches yet", () => {
    expect(strip({ form: [] })).toMatch(/>Form<[\s\S]*<p[^>]*>—<\/p>/);
    expect(strip({ form: null })).toMatch(/<p[^>]*>—<\/p>/);
  });

  it("drops the Next block when nothing is to come", () => {
    expect(strip({})).not.toContain(">Next<");
  });

  it("prints a week without its opponent as a dash on the plain plate", () => {
    const handed = strip({ next: [{ key: "gw8", gameweek: 8, against: null, minutes: 70 }] });
    expect(handed).toContain("var(--color-raised)");
    expect(handed).toMatch(/text-info"[^>]*>70</);
  });
});
