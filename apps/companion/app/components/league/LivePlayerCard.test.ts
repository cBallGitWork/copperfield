import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { BreakdownLine, FootballPlayer, Opposition, PlayerStory, SquadPlayerDetail } from "@epl/core";
import LivePlayerCard from "./LivePlayerCard";

vi.mock("next/image", () => ({ default: () => null }));
vi.mock("@/app/components/shell/Link", () => ({ default: (props: object) => createElement("a", props) }));
vi.mock("@/app/desk", async () => await import("../../desk"));
vi.mock("../../matchParts", () => ({ readMatchParts: () => new Promise(() => undefined) }));

const man: SquadPlayerDetail = {
  rostered: { slot: { fantraxId: "a", position: "D", status: "" }, unresolved: "unmapped" },
  club: undefined,
  opposition: undefined,
  points: undefined,
  minutes: [],
};

// Craig, 11 Oct 2026: a long story pushed Close below an iPhone's screen and the card could not be shut.
const story: PlayerStory = { content: "He trained apart again. ".repeat(120), at: null } as PlayerStory;

const html = renderToStaticMarkup(
  createElement(LivePlayerCard, { player: man, breakdown: [], played: null, reserve: false, story, onClose: () => undefined }),
);

describe("a player card with a long story", () => {
  it("is never taller than the screen between its safe areas", () => {
    expect(html).toMatch(/<dialog[^>]*class="[^"]*max-h-\[calc\(100dvh-var\(--safe-top\)-var\(--safe-bottom\)[^"]*"/);
  });

  it("scrolls the story inside the card, not the card off the screen", () => {
    const body = html.indexOf("overflow-y-auto");
    expect(body).toBeGreaterThan(-1);
    expect(html.indexOf("He trained apart")).toBeGreaterThan(body);
  });

  it("keeps Close at the foot, outside what scrolls", () => {
    const scroller = html.match(/<div class="[^"]*overflow-y-auto[^"]*">([\s\S]*)<\/div><div class="[^"]*shrink-0[^"]*">([\s\S]*)<\/div><\/dialog>/);
    expect(scroller?.[1]).not.toContain(">Close<");
    expect(scroller?.[2]).toContain(">Close<");
  });

  it("has a close cross in its title bar", () => {
    const head = html.slice(0, html.indexOf("overflow-y-auto"));
    expect(head).toMatch(/<button[^>]*aria-label="Close"/);
  });

  // A screen reader announced "Close, button" and no name (review M65).
  it("is named by its title", () => {
    const labelled = html.match(/<dialog[^>]*aria-labelledby="([^"]+)"/)?.[1];
    expect(labelled).toBeDefined();
    expect(html).toMatch(new RegExp(`<h2 id="${labelled}"`));
  });
});

// Craig, 11 Oct 2026: "Why wouldn't the player card in live games just use Fantrax data?" FPL 403'd mid-match.
describe("a live man's card with Fantrax and Opta but no FPL", () => {
  const fixture = { id: 1, code: 1, gameweek: 6, status: "live", kickoff: "2026-10-11T14:00:00Z" };
  const live: SquadPlayerDetail = {
    rostered: {
      slot: { fantraxId: "cal", position: "D", status: "" },
      player: { id: 9, code: 900, name: "Calafiori", fullName: "Riccardo Calafiori", optaCode: "p1", clubId: 1 } as FootballPlayer,
      stats: [],
    },
    club: undefined,
    opposition: [{ club: { shortName: "WHU" }, home: true, difficulty: 3, fixture } as unknown as Opposition],
    points: 0,
    minutes: [],
  };
  const card = (breakdown: BreakdownLine[], played: number | null) =>
    renderToStaticMarkup(
      createElement(LivePlayerCard, { player: live, breakdown, played, reserve: false, onClose: () => undefined }),
    );

  it("opens his full match stats", () => {
    const goals: BreakdownLine = { code: "G", name: "Goals", points: 6, value: "1" };
    expect(card([goals], 81)).toContain("Full match stats");
  });

  // Craig, 11 Oct 2026: "stats need to show still on live draft player card"; they sat behind a closed drop-down.
  it("shows his full match stats without a tap", () => {
    expect(card([], 81)).toMatch(/<details[^>]* open=""/);
  });

  it("takes his minutes from Fantrax, not from FPL's missing line", () => {
    expect(card([], 81)).toContain("Nothing has scored for him yet.");
    expect(card([], 81)).not.toContain("minutes have not registered");
  });

  // Foden on GW6: "Did not play." then "No match figures for him yet." on a finished week.
  it("says once that a man did not play, once his match is over", () => {
    const opposition = [{ ...live.opposition?.[0], fixture: { ...fixture, status: "finished" } } as Opposition];
    const benched = renderToStaticMarkup(
      createElement(LivePlayerCard, { player: { ...live, opposition }, breakdown: [], played: null, reserve: true, onClose: () => undefined }),
    );
    expect(benched).toContain("Did not play.");
    expect(benched).not.toContain("Full match stats");
  });
});
