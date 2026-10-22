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
vi.mock("../../players/[fantraxId]/cardRecord", () => ({ cardRecord: () => new Promise(() => undefined) }));

// Craig, 22 Oct 2026: "Player card sucks, no opponent or recent history, while space for the news."
describe("the card's form, run and folded news", () => {
  const upcoming = { id: 1, code: 1, gameweek: 8, status: "upcoming", kickoff: "2026-10-24T14:00:00Z" };
  const saliba = (): SquadPlayerDetail => ({
    rostered: {
      slot: { fantraxId: "sal", position: "D", status: "" },
      player: { id: 5, code: 500, name: "Saliba", fullName: "William Saliba", optaCode: "p5", clubId: 1, status: "a", chanceOfPlaying: null, news: "" } as FootballPlayer,
      stats: [],
    },
    club: undefined,
    opposition: [{ club: { shortName: "LIV" }, home: true, difficulty: 4, fixture: upcoming } as unknown as Opposition],
    points: 41,
    minutes: [
      { gameweek: 8, minutes: 80, asOf: "Tue 20 Oct" },
      { gameweek: 9, minutes: 60, asOf: "Tue 20 Oct" },
    ] as SquadPlayerDetail["minutes"],
  });
  const render = (props: Partial<Parameters<typeof PlayerCard>[0]> & { player: SquadPlayerDetail }) =>
    renderToStaticMarkup(createElement(PlayerCard, { onClose: () => undefined, ...props }));

  it("folds the news to its headline, the rest of the story behind a tap", () => {
    const told: PlayerStory = { id: "t", headline: "Saliba ruled out.", content: "Saliba ruled out. Weeks, not days.", analysis: null, at: null };
    const card = render({ player: saliba(), story: told });
    const fold = card.match(/<details class="group cm-panel">([\s\S]*?)<\/details>/)?.[1] ?? "";
    const summary = fold.match(/<summary[^>]*>([\s\S]*?)<\/summary>/)?.[1] ?? "";
    expect(summary).toContain("Saliba ruled out.");
    expect(summary).not.toContain("Weeks, not days.");
    expect(fold.slice(fold.indexOf("</summary>"))).toContain("Weeks, not days.");
  });

  it("prints a headline with nothing behind it unfolded, with no caret", () => {
    const told: PlayerStory = { id: "t", headline: "Saliba fit.", content: "Saliba fit.", analysis: null, at: null };
    const card = render({ player: saliba(), story: told });
    expect(card).toContain("Saliba fit.");
    expect(card).not.toContain("<summary");
    expect(card).not.toContain("line-clamp");
  });

  it("clamps the headline only inside the fold", () => {
    const told: PlayerStory = { id: "t", headline: "Saliba ruled out.", content: "Saliba ruled out. Weeks, not days.", analysis: null, at: null };
    const summary = render({ player: saliba(), story: told }).match(/<summary[^>]*>([\s\S]*?)<\/summary>/)?.[1] ?? "";
    expect(summary).toMatch(/line-clamp-2[^"]*">Saliba ruled out\.</);
  });

  it("puts his FPts beside the Form head, not in a block of its own", () => {
    expect(render({ player: saliba() })).toMatch(/>Form<\/span><span[^>]*><span title="Points this season">FPts<\/span>/);
  });

  it("puts a projection or a gameweek's points at the Next head, never over the form's league points", () => {
    for (const figure of ["projected", "gameweek"] as const) {
      const card = render({ player: saliba(), figure });
      expect(card).toMatch(/>Form<\/span><\/p>/);
      expect(card).toMatch(/>Next<\/span><span[^>]*><span title="[^"]+">(Proj|GW)<\/span> <span[^>]*text-info[^>]*>41<\/span> · xMins Tue 20 Oct/);
    }
  });

  it("holds the Form row's height while his matches are read", () => {
    expect(render({ player: saliba() })).toMatch(/<ol class="[^"]*min-h-20[^"]*" aria-busy="true"><\/ol>/);
  });

  it("keeps the strip under a live breakdown, without the season figure", () => {
    const fixture = { ...upcoming, status: "live" };
    const live = { ...saliba(), opposition: [{ ...saliba().opposition![0], fixture } as Opposition], points: 6 };
    const goal: BreakdownLine = { code: "G", name: "Goals", points: 6, value: "1" };
    const card = render({ player: live, breakdown: [goal], played: 70, reserve: false });
    expect(card).toContain(">Total<");
    expect(card).toContain(">Form<");
    expect(card).toContain(">Next<");
    // His match in play is this gameweek's, never "next" (UX-10).
    expect(card.slice(card.indexOf(">Next<"))).not.toContain(">GW8<");
    expect(card.slice(card.indexOf(">Next<"))).toContain(">GW9<");
  });

  it("puts the screen's own opponent on its week while the run is read", () => {
    expect(render({ player: saliba() })).toMatch(/>GW8<\/span><span[^>]*var\(--color-fdr-4\)[^>]*><span class="truncate">LIV</);
  });
});
