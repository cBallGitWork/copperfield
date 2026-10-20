import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { Fixture, FixtureStatus, FootballPlayer, FootballSnapshot, PlayerOwner } from "@epl/core";
import MatchList from "./MatchList";

vi.mock("next/image", () => ({ default: () => null }));
vi.mock("@/app/desk", () => ({ ROW_NAME: "" }));

const saka = { id: 1, code: 11, name: "Saka", fullName: "Bukayo Saka", clubId: 1 } as FootballPlayer;
const raya = { id: 2, code: 22, name: "Raya", fullName: "David Raya", clubId: 1 } as FootballPlayer;
const watkins = { id: 3, code: 33, name: "Watkins", fullName: "Ollie Watkins", clubId: 2 } as FootballPlayer;
const nobody = { id: 4, code: 44, name: "Nobody", fullName: "No Body", clubId: 2 } as FootballPlayer;

const owners = new Map<number, PlayerOwner>([
  [11, { teamId: "a", teamName: "Raccoons" }],
  [22, { teamId: "a", teamName: "Raccoons" }],
  [33, { teamId: "b", teamName: "Badgers" }],
]);

/** One stat line: a goal for a scorer, nothing for a man who only turned out. */
function line(player: FootballPlayer, goals: number) {
  return { playerId: player.id, fixtureId: 1, goals, assists: 0, yellowCards: 0, redCards: 0, saves: 0, minutes: 90 };
}

/** Saka and Raya his, Saka and Watkins scoring and Nobody, unheld, scoring too. */
function list(status: FixtureStatus, opts: { lines?: "none" | "unavailable" | "quiet"; now?: boolean } = {}): string {
  const fixture = {
    id: 1, code: 1, gameweek: 7, homeClubId: 1, awayClubId: 2, kickoff: "2026-10-10T14:00:00Z",
    homeScore: 2, awayScore: 1, status, settled: false, minutes: 12, homeDifficulty: null, awayDifficulty: null,
  } as Fixture;
  const stats = opts.lines === "quiet" ? [] : [line(saka, 1), line(watkins, 1), line(nobody, 1)];
  const snapshot = {
    clubs: [], players: [saka, raya, watkins, nobody], fixtures: [fixture], stats,
    statsUnavailable: opts.lines === "unavailable",
  } as unknown as FootballSnapshot;
  return renderToStaticMarkup(
    createElement(MatchList, {
      fixture,
      clubs: new Map(),
      lines: opts.lines === "none" ? null : snapshot,
      now: opts.now ?? true,
      yours: [saka, raya],
      owners,
    }),
  );
}

describe("his men in a match", () => {
  it("names every one of them, the man who did nothing too", () => {
    expect(list("finished")).toMatch(/>Yours<\/span> · Saka · Raya</);
  });

  it("tags each scorer with his holder: his own in the accent, a rival's faint, an unheld man untagged", () => {
    const out = list("finished");
    expect(out).toMatch(/text-accent">Raccoons</);
    expect(out).toMatch(/text-faint">Badgers</);
    expect(out.match(/text-2xs (text-accent|text-faint)">/g)).toHaveLength(2);
  });
});

describe("a match with nothing to list", () => {
  it("says the scorers are missing rather than letting a score read as nobody scoring", () => {
    const out = list("finished", { lines: "unavailable" });
    expect(out).toContain("Scorers not available right now.");
    expect(out).not.toContain("Badgers");
  });

  it("says the same of a played match with no lines to read", () => {
    expect(list("finished", { lines: "none" })).toContain("Scorers not available right now.");
  });

  it("says nothing yet while a fresh copy has it in play", () => {
    expect(list("live", { lines: "quiet" })).toContain("Nothing to report yet.");
  });

  it("never says yet of a match a stale copy has in play", () => {
    expect(list("live", { lines: "quiet", now: false })).toContain("Nothing to report.");
  });

  it("lists only his men before a ball is kicked, when there are no lines to read", () => {
    const out = list("upcoming", { lines: "none" });
    expect(out).toMatch(/>Yours<\/span> · Saka · Raya</);
    expect(out).not.toContain("Nothing to report");
  });
});
