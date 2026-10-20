import { createElement, type ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import type { FormGame, StandingsRow } from "@epl/core";
import { repeatedKeys } from "../../repeatedKeys";
import StandingsTable from "./StandingsTable";
import { COLUMNS, leagueLine } from "../../league/Columns";

// The app's `@/` alias is Next's, not vitest's: each is the real module by its relative path, or a stand-in.
vi.mock("@/app/desk", () => import("../../desk"));
vi.mock("@/app/mine", () => import("../../mine"));
vi.mock("@/app/config", () => import("../../config"));
vi.mock("@/app/components/shell/Absent", () => import("../shell/Absent"));
vi.mock("@/app/components/shell/Link", () => ({ default: (props: object) => createElement("a", props) }));
vi.mock("@/app/components/league/TeamName", () => ({ default: () => null }));
vi.mock("@/app/components/league/StandingsTable", () => import("./StandingsTable"));
vi.mock("@/app/squad/routes", () => import("../../squad/routes"));
vi.mock("./ScrollBoard", () => ({ default: ({ children }: { children: ReactNode }) => children }));

const row = { teamId: "t1", teamName: "test1", rank: 1, won: 2, drawn: 0, lost: 0, played: 2, points: 6, pointsFor: 90, pointsAgainst: 70 } as StandingsRow;
const game = (period: number, result: FormGame["result"]): FormGame => ({ period, result, pointsFor: 40, pointsAgainst: 30 });

describe("a league table row", () => {
  it("keys both results of a double header apart in its form", () => {
    // The real league's gameweek 34 pairs every team twice in period 34 (PLATFORM_NOTES, 2 Oct 2026).
    const form = new Map([["t1", [game(33, "W"), game(34, "W"), game(34, "L")]]]);
    const line = leagueLine(row, { places: new Map(), mine: null, form, calendar: [] });
    const table = StandingsTable({ columns: COLUMNS, lines: [line], sort: "rank" });
    expect(repeatedKeys(table)).toEqual([]);
  });
});

describe("the league table's columns", () => {
  it("end on Pts under a thumb, printed once (Craig, 19 Oct 2026)", () => {
    const phone = COLUMNS.filter((column) => column.deskOnly === undefined).map((column) => column.label);
    expect(phone).toEqual(["Placing", "Team", "Pld", "W", "D", "L", "For", "Pts"]);
    expect(COLUMNS.filter((column) => column.key === "pts")).toHaveLength(1);
  });
});
