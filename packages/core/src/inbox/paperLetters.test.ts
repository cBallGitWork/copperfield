import { describe, expect, it } from "vitest";
import type { StoryDraftMatchup, StoryDraftSide } from "../gazette/matchups/cargo";
import type { PublishedStory } from "../gazette/story";
import { paperNews } from "./paperLetters";

const NAMES = new Map([
  ["me", "Raccoons"],
  ["ban", "Bannan"],
  ["haz", "Hazza"],
  ["dome", "Dome"],
]);
const reader = { mine: "me", name: (teamId: string) => NAMES.get(teamId) ?? null, href: (slug: string) => `/paper/${slug}` };

function story(over: Partial<PublishedStory>): PublishedStory {
  return {
    slug: "gw6-draft-report",
    kind: "draft-report",
    leagueId: "real",
    period: 6,
    gameweek: 6,
    filedAt: "2026-10-13T17:54:41.502Z",
    expiresAt: null,
    edition: "The Dugout",
    byline: "The Dugout",
    headline: "Stach stashed safely in the eleven",
    deck: "Cowthenbeef beat The Truffle Pigs 46-44",
    body: "",
    subjects: [],
    image: null,
    face: null,
    ...over,
  };
}

function side(teamId: string, score: number): StoryDraftSide {
  const returns = { goals: [], assists: [], cleanSheets: [] };
  return { teamId, name: `full ${teamId}`, score, rankBefore: null, rankAfter: null, run: "", returns, eleven: [], bench: [] };
}

function tie(home: StoryDraftSide, away: StoryDraftSide, standfirst: string): StoryDraftMatchup {
  return { home, away, verdict: "", standfirst, paragraphs: [], story: null, face: null };
}

function report(matchups: StoryDraftMatchup[], cutoff: "gameweek" | "saturday" = "gameweek"): PublishedStory {
  return story({ extras: { draft: { cutoff, gameweek: 6, matchups } } });
}

describe("paperNews", () => {
  it("writes the reader's tie in the draft report as a letter linking its section", () => {
    const filed = report([tie(side("haz", 40), side("dome", 30), "Hazza won."), tie(side("ban", 34), side("me", 47), "Raccoons ran away with it.")]);
    expect(paperNews([filed], reader)).toEqual([
      {
        id: "paper:gw6-draft-report:d-2",
        category: "message",
        at: "2026-10-13T17:54:41.502Z",
        gameweek: 6,
        headline: "The Gazetta on your win over Bannan",
        body: "Raccoons ran away with it.",
        from: "The Dugout",
        about: null,
        teamId: null,
        mark: null,
        urgent: false,
        link: { href: "/paper/gw6-draft-report#d-2", label: "Read the article" },
      },
    ]);
  });

  it("says a defeat and a draw as such, and files one letter for each tie of a double header", () => {
    const filed = report([tie(side("me", 30), side("ban", 41), "a"), tie(side("haz", 38), side("me", 38), "b")]);
    expect(paperNews([filed], reader).map((item) => [item.id, item.headline])).toEqual([
      ["paper:gw6-draft-report:d-1", "The Gazetta on your defeat by Bannan"],
      ["paper:gw6-draft-report:d-2", "The Gazetta on your draw with Hazza"],
    ]);
  });

  it("falls back to the report's own name for a team the league no longer names", () => {
    const filed = report([tie(side("me", 50), side("gone", 10), "a")]);
    expect(paperNews([filed], reader)[0]?.headline).toBe("The Gazetta on your win over full gone");
  });

  it("files nothing for a report whose ties are other teams'", () => {
    expect(paperNews([report([tie(side("haz", 40), side("dome", 30), "a")])], reader)).toEqual([]);
  });

  it("writes the predictions' call on his tie, its first paragraph the body", () => {
    const predictions = story({
      slug: "gw7-predictions",
      kind: "predictions",
      byline: "Mark Lawrenson",
      deck: "Lawro backs two outsiders.",
      ties: [
        { homeTeamId: "haz", awayTeamId: "dome", line: "Not ours.", callsTeamId: "haz" },
        { homeTeamId: "me", awayTeamId: "haz", line: "Raccoons at home.\n\nRaccoons, because.", callsTeamId: "haz" },
      ],
    });
    const [letter, ...rest] = paperNews([predictions], reader);
    expect(rest).toEqual([]);
    expect(letter).toMatchObject({
      id: "paper:gw7-predictions:haz",
      headline: "The Gazetta backs Hazza to beat you",
      body: "Raccoons at home.",
      from: "Mark Lawrenson",
      link: { href: "/paper/gw7-predictions", label: "Read the article" },
    });
  });

  it("says who the predictions back, or that they made no call, and keeps the deck for a tie with no line", () => {
    const backed = story({ kind: "predictions", ties: [{ homeTeamId: "ban", awayTeamId: "me", line: "", callsTeamId: "me" }] });
    const open = story({ kind: "predictions", ties: [{ homeTeamId: "me", awayTeamId: "ban", line: "Too close.", callsTeamId: null }] });
    expect(paperNews([backed], reader)[0]).toMatchObject({ headline: "The Gazetta backs you to beat Bannan", body: backed.deck });
    expect(paperNews([open], reader)[0]?.headline).toBe("The Gazetta on your tie with Bannan");
  });

  it("writes Here We Go to the side the cargo names, and no other", () => {
    const trade = story({
      slug: "here-we-go-tx1",
      kind: "trade",
      byline: "Here We Go",
      deck: "Dome get Jeremy Doku from Truffles for Eberechi Eze",
      face: { code: 1, name: "Jeremy Doku", clubId: 15, position: "M" },
      extras: { transfer: { teamId: "dome", team: "Dome" } },
    });
    expect(paperNews([trade], { ...reader, mine: "dome" })[0]).toMatchObject({
      id: "paper:here-we-go-tx1",
      headline: "The Gazetta on your signing of Jeremy Doku",
      body: "Dome get Jeremy Doku from Truffles for Eberechi Eze",
    });
    expect(paperNews([trade], reader)).toEqual([]);
  });

  it("gives the power rankings' place and line for his team", () => {
    const ranks = story({
      slug: "gw6-season-rankings",
      kind: "season-rankings",
      extras: { ranks: [{ teamId: "haz", line: "Top." }, { teamId: "ban", line: "Next." }, { teamId: "me", line: "Third, and solid." }] },
    });
    expect(paperNews([ranks], reader)[0]).toMatchObject({ headline: "The Gazetta ranks you 3rd", body: "Third, and solid." });
  });

  it("files nothing for a story no team is in as data, nor for anyone signed out", () => {
    const bin = story({ slug: "gw6-bin-xi", kind: "bin-xi", body: "Raccoons let him go." });
    const prem = story({ slug: "gw6-prem-report-2026-10-10", kind: "match-report", body: "Raccoons' man scored." });
    expect(paperNews([bin, prem], reader)).toEqual([]);
    expect(paperNews([report([tie(side("me", 1), side("ban", 0), "a")])], { ...reader, mine: null })).toEqual([]);
  });
});
