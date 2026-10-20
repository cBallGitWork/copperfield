import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { repeatedKeys } from "../../../repeatedKeys";
import type { FootballPlayer, PlGoal, PlGoalGroup, PlManMatch, SheetRow } from "@epl/core";
import Scoresheet from "./Scoresheet";

// Two goals nobody can place, scored in one minute: core keeps them as two rows (#421).
const unplaced: PlGoalGroup = { scorer: null, own: false, minutes: [30], assisters: [] };
vi.mock("@epl/core", async (actual) => ({ ...(await actual<object>()), goalGroups: () => [unplaced, { ...unplaced }] }));
const figures = vi.hoisted(() => [] as string[]);
vi.mock("./ScoreRows", () => ({ Goal: () => null, Man: ({ figure }: { figure: string }) => (figures.push(figure), null) }));

describe("the scoresheet", () => {
  it("keys two unplaced scorers' goals in one minute apart", () => {
    const goals = [{} as PlGoal];
    const sheet = Scoresheet({
      home: goals, away: [], homeElse: [], awayElse: [],
      owners: new Map(), byCode: new Map(), did: new Map(), injured: new Map(), cards: new Map(),
    });
    expect(repeatedKeys(sheet)).toEqual([]);
  });

  // Review: the sheet said 90+2' while Line Ups' sub note said 90' for the same man.
  it("prints a man carried off in added time as Line Ups does", () => {
    figures.length = 0;
    const player = { id: 1, code: 9, name: "Iwobi", fullName: "Alex Iwobi" } as FootballPlayer;
    const line = { penaltiesSaved: 0, penaltiesMissed: 0, redCards: 0 } as SheetRow["line"];
    const man = { offAt: 90, added: { offAt: 2 } } as PlManMatch;
    const sheet = Scoresheet({
      home: [], away: [], homeElse: [{ player, line }], awayElse: [],
      owners: new Map(), byCode: new Map(), did: new Map([[9, man]]), injured: new Map([[9, 90]]), cards: new Map(),
    });
    renderToStaticMarkup(sheet);
    expect(figures).toEqual(["90+2'"]);
  });
});
