import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { BreakdownLine, FootballPlayer, Opposition, PlayerStory, SquadPlayerDetail } from "@epl/core";
import PlayerCard from "./PlayerCard";

vi.mock("next/image", () => ({ default: () => null }));
vi.mock("@/app/components/shell/Link", () => ({ default: (props: object) => createElement("a", props) }));
vi.mock("@/app/desk", async () => await import("../../desk"));
vi.mock("../../matchParts", () => ({ readMatchParts: () => new Promise(() => undefined) }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: () => undefined }) }));
vi.mock("../../players/[fantraxId]/latestNews", () => ({ latestNews: () => new Promise(() => undefined) }));

const man: SquadPlayerDetail = {
  rostered: { slot: { fantraxId: "a", position: "D", status: "" }, unresolved: "unmapped" },
  club: undefined,
  opposition: undefined,
  points: undefined,
  minutes: [],
};

// Craig, 11 Oct 2026: a long story pushed Close below an iPhone's screen and the card could not be shut.
const story: PlayerStory = { id: "s", headline: "He trained apart again.", content: "He trained apart again. ".repeat(120), analysis: null, at: null };

const html = renderToStaticMarkup(
  createElement(PlayerCard, { player: man, breakdown: [], played: null, reserve: false, story, onClose: () => undefined }),
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
      player: { id: 9, code: 900, name: "Calafiori", fullName: "Riccardo Calafiori", optaCode: "p1", clubId: 1, status: "a", news: "", chanceOfPlaying: null } as FootballPlayer,
      stats: [],
    },
    club: undefined,
    opposition: [{ club: { shortName: "WHU" }, home: true, difficulty: 3, fixture } as unknown as Opposition],
    points: 0,
    minutes: [],
  };
  const card = (breakdown: BreakdownLine[], played: number | null) =>
    renderToStaticMarkup(
      createElement(PlayerCard, { player: live, breakdown, played, reserve: false, onClose: () => undefined }),
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
      createElement(PlayerCard, { player: { ...live, opposition }, breakdown: [], played: null, reserve: true, onClose: () => undefined }),
    );
    expect(benched).toContain("Did not play.");
    expect(benched).not.toContain("Full match stats");
  });
});

// Craig, 19 Oct 2026: a tap on a match day "brings up no live points for the player/scores etc, just an empty card",
// while production logged FPL 403s and Fantrax timeouts.
describe("a live man's card when a provider would not answer", () => {
  const upcoming = { id: 1, code: 1, gameweek: 7, status: "upcoming", kickoff: "2026-10-18T13:00:00Z" };
  const haaland: SquadPlayerDetail = {
    rostered: {
      slot: { fantraxId: "061vq", position: "F", status: "" },
      player: { id: 411, code: 223094, name: "Haaland", fullName: "Erling Haaland", optaCode: "p223094", clubId: 15, status: "a", news: "", chanceOfPlaying: null } as FootballPlayer,
      stats: [],
    },
    club: undefined,
    // FPL's fixtures held from before kickoff: its read was refused since.
    opposition: [{ club: { shortName: "IPS" }, home: true, difficulty: 3, fixture: upcoming } as unknown as Opposition],
    points: 10,
    minutes: [],
  };
  const goals: BreakdownLine = { code: "G", name: "Goals", points: 8, value: "2" };
  const card = (player: SquadPlayerDetail, breakdown: BreakdownLine[], played: number | null) =>
    renderToStaticMarkup(createElement(PlayerCard, { player, breakdown, played, reserve: false, onClose: () => undefined }));

  it("shows Fantrax's points once Fantrax has priced him, though FPL's fixture still reads as to come", () => {
    const html = card(haaland, [goals], 90);
    expect(html).toContain("Goals");
    expect(html).toMatch(/>10</);
    expect(html).not.toContain("Kicks off");
  });

  it("says it could not get his points, with a way to try again, when Fantrax's table is missing", () => {
    const live = { ...upcoming, status: "live" };
    const started = { ...haaland, opposition: [{ ...haaland.opposition![0], fixture: live } as Opposition], points: undefined };
    const html = card(started, [], null);
    expect(html).toContain("No breakdown right now.");
    expect(html).toMatch(/<button[^>]*>Try again<\/button>/);
  });
});


// Craig, 21 Oct 2026: an EMPTY card on his iPhone, head and foot and a body 0px tall (UI-AUDIT D-4).
describe("the card's body", () => {
  const body = (markup: string) => markup.match(/<div class="([^"]*overflow-y-auto[^"]*)">([\s\S]*?)<\/div><div class="[^"]*shrink-0/);

  it("sizes to its content and keeps a floor, so WebKit cannot collapse it to nothing", () => {
    const classes = body(html)?.[1] ?? "";
    expect(classes).toContain("flex-auto");
    expect(classes).not.toContain("flex-1");
    expect(classes).toMatch(/\bmin-h-24\b/);
  });

  it("always holds who he is, even for a slot the bridge has not settled", () => {
    const quiet = renderToStaticMarkup(createElement(PlayerCard, { player: man, onClose: () => undefined }));
    expect(body(quiet)?.[2]).toContain("No fixture");
  });
});

// One card for every tap (UI-AUDIT D-4, D-26): the fitness line, FPts and xMins whichever screen opened it.
describe("one player card", () => {
  const upcoming = { id: 1, code: 1, gameweek: 8, status: "upcoming", kickoff: "2026-10-24T14:00:00Z" };
  const saliba = (over: Partial<FootballPlayer> = {}): SquadPlayerDetail => ({
    rostered: {
      slot: { fantraxId: "sal", position: "D", status: "" },
      player: {
        id: 5, code: 500, name: "Saliba", fullName: "William Saliba", optaCode: "p5", clubId: 1,
        status: "i", chanceOfPlaying: 0, news: "Ankle injury - Unknown return date",
        ...over,
      } as FootballPlayer,
      stats: [],
    },
    club: undefined,
    opposition: [{ club: { shortName: "LIV" }, home: true, difficulty: 4, fixture: upcoming } as unknown as Opposition],
    points: 41,
    minutes: [
      { gameweek: 8, minutes: 20, asOf: "Tue 20 Oct" },
      { gameweek: 9, minutes: 85, asOf: "Tue 20 Oct" },
    ] as SquadPlayerDetail["minutes"],
  });
  const render = (props: Partial<Parameters<typeof PlayerCard>[0]> & { player: SquadPlayerDetail }) =>
    renderToStaticMarkup(createElement(PlayerCard, { onClose: () => undefined, ...props }));

  it("marks an injured man with CM's cross in his band, washed, and no state box", () => {
    const card = render({ player: saliba() });
    expect(card).toMatch(/<svg[^>]*role="img"[^>]*aria-label="Injured"/);
    expect(card).toContain("cm-doubt-out");
    expect(card).toContain("Ankle injury");
    expect(card).toContain(">0%<");
    expect(card).not.toContain("cm-state");
  });

  it("marks him on the live card too, which used to print no fitness at all", () => {
    expect(render({ player: saliba(), breakdown: [], played: null, reserve: true })).toContain("cm-doubt-out");
  });

  it("prints no fitness line for a fit man", () => {
    const card = render({ player: saliba({ status: "a", chanceOfPlaying: null, news: "" }) });
    expect(card).not.toContain("cm-doubt-");
    expect(card).not.toMatch(/role="img"/);
  });

  it("prints his FPts in the derived cyan where no breakdown is handed", () => {
    expect(render({ player: saliba() })).toMatch(/>FPts<[\s\S]*?class="[^"]*text-info[^"]*">41</);
  });

  it("prints no FPts where the screen had no table", () => {
    expect(render({ player: { ...saliba(), points: undefined } })).not.toContain(">FPts<");
  });

  it("totals the gameweek's breakdown in cyan, never lit", () => {
    const fixture = { ...upcoming, status: "live" };
    const live = { ...saliba(), opposition: [{ ...saliba().opposition![0], fixture } as Opposition], points: 6 };
    const goal: BreakdownLine = { code: "G", name: "Goals", points: 6, value: "1" };
    const card = render({ player: live, breakdown: [goal], played: 70, reserve: false });
    expect(card).toMatch(/>Total<[\s\S]*?class="[^"]*text-info[^"]*">6</);
    expect(card).not.toContain(">FPts<");
  });

  it("inks a doubtful week's xMins red and a safe one cyan", () => {
    const card = render({ player: saliba() });
    expect(card).toMatch(/text-bad[^"]*">20</);
    expect(card).toMatch(/text-info[^"]*">85</);
  });

  it("names every position he may play, as his row does, not only his slot", () => {
    expect(render({ player: saliba(), eligible: ["M", "D"] })).toContain("D/M");
    expect(render({ player: saliba() })).toContain("DEF");
  });

  it("prints his auto sub and the story handed in", () => {
    const told: PlayerStory = { id: "t", headline: "Saliba ruled out.", content: "Saliba ruled out. Weeks, not days.", analysis: null, at: null };
    const card = render({ player: saliba(), breakdown: [], played: null, reserve: false, autoSub: "On for Gabriel", story: told });
    expect(card).toContain("On for Gabriel");
    expect(card).toContain("Saliba ruled out.");
    expect(card).toContain("Weeks, not days.");
  });
});
