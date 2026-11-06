import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { PublishedStory } from "@epl/core";
import names from "../../../../../data/leagues/short-names.json";
import { LINEUP_NEWS_MEN } from "../../config";
import Lineups from "./Lineups";

vi.mock("next/image", () => ({ default: () => null }));

// A team whose short name differs from its Fantrax name.
const [teamId, entry] = Object.entries(names.shortNames).find(([, each]) => each.short !== each.team) ?? ["", { team: "", short: "" }];
const side = (club: string) => ({ club, code: 3, formation: "4-3-3", men: [{ name: "Tarkowski", position: "CB", owner: teamId }] });
const story = { extras: { lineups: [{ home: side("Everton"), away: side("Hull City"), kickoff: "2026-10-10T14:00:00Z" }] } } as PublishedStory;

describe("the predicted line-ups", () => {
  it("prints an owner by the league's short name, as the Team Sheet does", () => {
    const html = renderToStaticMarkup(createElement(Lineups, { story, named: () => entry.team, mine: null }));
    expect(html).toContain(`(<em>${entry.short}</em>)`);
    expect(html).not.toContain(`<em>${entry.team}</em>`);
  });

  it("marks a predicted starter the football has out, and keeps him in the eleven", () => {
    const out = { name: "Isak", position: "CF", status: "OUT" as const };
    const marked = { extras: { lineups: [{ home: { ...side("Liverpool"), men: [out] }, away: side("Man City"), kickoff: "2026-10-10T14:00:00Z" }] } } as PublishedStory;
    const html = renderToStaticMarkup(createElement(Lineups, { story: marked, named: () => entry.team, mine: null }));
    expect(html.replace(/<[^>]+>/g, "")).toContain("IsakOUT");
  });

  it("sets each man's position in bold", () => {
    const html = renderToStaticMarkup(createElement(Lineups, { story, named: () => entry.team, mine: null }));
    expect(html).toMatch(/<span class="[^"]*font-bold[^"]*">CB<\/span>/);
  });

  it("prints each man's xMins, bold under fifty, and a dash where there is none", () => {
    const men = [{ name: "Low", position: "CB", xMins: 34 }, { name: "Full", position: "CB", xMins: 88 }, { name: "None", position: "CB" }];
    const listed = { extras: { lineups: [{ home: { ...side("Everton"), men }, away: side("Hull City"), kickoff: "2026-10-10T14:00:00Z" }] } } as PublishedStory;
    const html = renderToStaticMarkup(createElement(Lineups, { story: listed, named: () => entry.team, mine: null }));
    const figure = (text: string) => new RegExp(`<span title="Expected minutes" class="([^"]*)">${text}</span>`).exec(html)?.[1] ?? "";
    expect(figure("34")).toContain("font-bold");
    expect(figure("88")).not.toContain("font-bold");
    expect(figure("—")).not.toBe("");
  });

  it("prints no xMins at all from a filing that carries none", () => {
    const html = renderToStaticMarkup(createElement(Lineups, { story, named: () => entry.team, mine: null }));
    expect(html).not.toContain("Expected minutes");
  });

  it("prints a side's team news under its eleven, OUT before the doubts, and nothing where there is none", () => {
    const news = [
      { name: "Doubtful", status: "Doubt" as const, note: "Knock" },
      { name: "Saka", status: "OUT" as const, note: "Hamstring injury", owner: teamId },
      { name: "White", status: "OUT" as const },
    ];
    const listed = { extras: { lineups: [{ home: { ...side("Arsenal"), news }, away: side("Hull City"), kickoff: "2026-10-10T14:00:00Z" }] } } as PublishedStory;
    const text = renderToStaticMarkup(createElement(Lineups, { story: listed, named: () => entry.team, mine: null })).replace(/<[^>]+>/g, "");
    expect(text).toContain(`OUTSaka (${entry.short}) – Hamstring injury; White`);
    expect(text).toContain("DoubtDoubtful – Knock");
    expect(text.indexOf("OUTSaka")).toBeLessThan(text.indexOf("DoubtDoubtful"));
    const plain = renderToStaticMarkup(createElement(Lineups, { story, named: () => entry.team, mine: null })).replace(/<[^>]+>/g, "");
    expect(plain).not.toMatch(/OUT|Doubt/);
  });

  it("names only the first few of a long list, and counts the rest", () => {
    const news = Array.from({ length: LINEUP_NEWS_MEN + 3 }, (_, at) => ({ name: `Hurt${at}`, status: "OUT" as const }));
    const listed = { extras: { lineups: [{ home: { ...side("Hull City"), news }, away: side("Everton"), kickoff: "2026-10-10T14:00:00Z" }] } } as PublishedStory;
    const text = renderToStaticMarkup(createElement(Lineups, { story: listed, named: () => entry.team, mine: null })).replace(/<[^>]+>/g, "");
    expect(text).toContain(`Hurt${LINEUP_NEWS_MEN - 1}`);
    expect(text).not.toContain(`Hurt${LINEUP_NEWS_MEN}`);
    expect(text).toContain("+3 more");
  });
});
