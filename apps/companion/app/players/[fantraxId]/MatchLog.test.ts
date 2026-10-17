import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { Club, GameLogEntry, PlayerMatch } from "@epl/core";
import MatchLog from "./MatchLog";
import type { MatchRow } from "./matchRows";

vi.mock("@/app/desk", () => import("../../desk"));
vi.mock("@/app/components/shell/Link", () => ({ default: (props: object) => createElement("a", props) }));

const EVE: Club = { id: 1, code: 11, name: "Everton", shortName: "EVE" };

const row = (match: Partial<GameLogEntry>, paid: Partial<PlayerMatch> | null): MatchRow => ({
  fpl: {
    opponent: EVE,
    match: {
      gameweek: 6, fixtureId: 60, opponentClubId: 1, home: true, scored: 2, conceded: 2,
      minutes: 90, goals: 0, assists: 0, cleanSheet: false, yellowCards: 0, redCards: 0,
      saves: 4, fplPoints: 2, defensiveContribution: null,
      expectedGoals: 0, expectedAssists: 0, starts: 1, tackles: null, clearancesBlocksInterceptions: null,
      recoveries: null, expectedGoalsConceded: null, goalsConceded: 2, ...match,
    },
  },
  paid: paid === null ? null : {
    opponent: "EVE", home: true, points: 2, minutes: null, goals: null, assists: null,
    shots: null, shotsOnTarget: null, foulsCommitted: 0, foulsSuffered: 0, offsides: null, ...paid,
  },
  mark: null,
});

/** The cells under one head, in row order. */
function column(html: string, head: string): string[] {
  const text = (cell: string) => cell.replace(/<[^>]+>/g, "").trim();
  const thead = html.match(/<thead>([\s\S]*?)<\/thead>/)?.[1] ?? "";
  const at = [...thead.matchAll(/<th[^>]*>([\s\S]*?)<\/th>/g)].map((m) => text(m[1])).indexOf(head);
  if (at < 0) return [];
  const tbody = html.match(/<tbody>([\s\S]*?)<\/tbody>/)?.[1] ?? "";
  return [...tbody.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)].map(
    (m) => [...m[1].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/g)].map((c) => text(c[1]))[at],
  );
}

const render = (rows: MatchRow[]) => renderToStaticMarkup(createElement(MatchLog, { rows }));

describe("the match log", () => {
  it("prints a clean sheet he did not keep as 0, and dashes one he was not on for", () => {
    const html = render([row({ cleanSheet: false }, {}), row({ cleanSheet: true, conceded: 0, fixtureId: 61 }, {}), row({ minutes: 0, fixtureId: 62 }, {})]);
    expect(column(html, "CS")).toEqual(["0", "1", "—"]);
  });

  it("stands down a column no match of his measured, as Fantrax's keeper table has no shots", () => {
    const html = render([row({}, {}), row({ fixtureId: 61 }, {})]);
    expect(column(html, "Sh")).toEqual([]);
    expect(column(html, "Off")).toEqual([]);
    expect(column(html, "FC")).toEqual(["0", "0"]);
    // The rule that starts Fantrax's account moves to its first column drawn.
    expect(html).toMatch(/<th[^>]*title="Fouls committed"[^>]*border-l/);
  });

  it("keeps a column one match measured, dashing the match Fantrax's window does not reach", () => {
    const html = render([row({}, { shots: 0 }), row({ fixtureId: 61 }, null)]);
    expect(column(html, "Sh")).toEqual(["0", "—"]);
  });
});
