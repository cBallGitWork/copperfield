import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { repeatedKeys } from "../../repeatedKeys";
import { LEAGUE_COMPETITION, type LeagueTeam } from "@epl/core";
import Season from "./Season";
import type { SeasonRow } from "./teamSeason";

// The app's `@/` alias is Next's, not vitest's: each is the real module by its relative path, or a stand-in.
vi.mock("@/app/desk", () => import("../../desk"));
vi.mock("@/app/mine", () => import("../../mine"));
vi.mock("@/app/components/shell/Link", () => ({ default: (props: object) => createElement("a", props) }));
vi.mock("@/app/squad/routes", () => import("../../squad/routes"));
vi.mock("@/app/components/league/TeamName", () => ({ default: ({ name }: { name: string }) => name }));

const team = (teamId: string): LeagueTeam => ({ teamId, name: teamId });
const CUP = { id: "cup", name: "Timbeibs Cup" };

/** One of this team's ties in `gameweek`, against `opponent`. */
const tie = (opponent: string, gameweek = 34, over: Partial<SeasonRow["round"]> = {}, competition = LEAGUE_COMPETITION): SeasonRow => ({
  round: { gameweek, period: gameweek, deadline: null, kickoff: null, status: "upcoming", started: false, ...over },
  tie: { competition, round: competition === CUP ? "Round 1" : null, code: null, home: { team: team("me"), label: "me" }, away: { team: team(opponent), label: opponent } },
  pointsFor: over.started ? 50 : null,
  pointsAgainst: over.started ? 40 : null,
  opponent: { team: team(opponent), label: opponent },
});

const FINISHED = { status: "finished", started: true } as const;
const draw = (order: { toCome: SeasonRow[]; played: SeasonRow[] }) => renderToStaticMarkup(Season({ order, teamId: "me" }));
/** Each row's li markup, in the order drawn. */
const items = (html: string) => [...html.matchAll(/<li[^>]*>(.*?)<\/li>/g)].map((match) => match[0]);

describe("a team's season", () => {
  it("keys both ties of a double header apart", () => {
    // The real league's gameweek 34 pairs every team twice (PLATFORM_NOTES, 2 Oct 2026).
    expect(repeatedKeys(Season({ order: { toCome: [tie("a"), tie("b")], played: [] }, teamId: "me" }))).toEqual([]);
  });

  it("draws the gameweeks to come first, then one Played row, then the played", () => {
    const html = draw({ toCome: [tie("next", 8), tie("later", 9)], played: [tie("last", 7, FINISHED), tie("first", 6, FINISHED)] });
    const order = items(html).map((li) => li.match(/GW\d+|Played/)?.[0]);
    expect(order).toEqual(["GW8", "GW9", "Played", "GW7", "GW6"]);
    expect(html.match(/>Played</g)).toHaveLength(1);
  });

  it("lights the current gameweek's rows with the accent edge and no other", () => {
    const rows = items(draw({ toCome: [tie("a", 8), tie("b", 8), tie("c", 9)], played: [tie("d", 7, FINISHED)] })).filter((li) => li.includes("GW"));
    expect(rows.map((li) => li.includes("border-l-accent"))).toEqual([true, true, false, false]);
    expect(rows.every((li) => li.includes("border-l-4"))).toBe(true);
  });

  it("names a cup under the opponent on a phone and leaves a league row bare", () => {
    const [league, cup] = items(draw({ toCome: [tie("a", 10), tie("b", 10, {}, CUP)], played: [] }));
    expect(cup).toMatch(/lg:hidden[^"]*"[^>]*>Timbeibs Cup/);
    expect(league).not.toMatch(/lg:hidden[^"]*"[^>]*>League/);
    // The cyan column itself is the desk's alone.
    expect(league).toMatch(/class="hidden [^"]*text-info lg:flex/);
  });

  it("prints a gameweek to come as a faint dash, off the plate, still opening the matchup", () => {
    const [row] = items(draw({ toCome: [tie("a", 8)], played: [] }));
    expect(row).toMatch(/<a href="[^"]*gw=8&amp;vs=a" class="[^"]*min-h-11/);
    expect(row).toMatch(/<span class="[^"]*h-6 w-12[^"]*text-faint[^"]*">—<\/span>/);
    expect(row).not.toMatch(/cm-index[^"]*h-6 w-12[^"]*">—/);
  });

  it("prints a lowercase v", () => {
    const [row] = items(draw({ toCome: [tie("a", 8)], played: [] }));
    expect(row).toMatch(/<span class="[^"]*text-faint[^"]*">v<\/span>/);
    expect(row).not.toMatch(/uppercase[^"]*">v</);
  });
});
