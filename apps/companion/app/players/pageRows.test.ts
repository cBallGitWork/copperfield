import { describe, expect, it } from "vitest";
import { drawnCount, litRows, nextStep, pageRows } from "./pageRows";
import { cutsFor } from "./standout";
import { PAGE_ROWS } from "./query";

describe("pageRows", () => {
  const shown = Array.from({ length: 100 }, (_, at) => at);

  // M-SQUADS-1, Craig 20 Oct 2026: a hundred two-line men ran eight screens on a phone.
  it("draws thirty at every width, the server never guessing the screen", () => {
    expect(PAGE_ROWS).toBe(30);
    expect(pageRows(shown, {})).toHaveLength(30);
  });

  it("draws every row for ?all=1", () => {
    expect(pageRows(shown, { all: "1" })).toHaveLength(shown.length);
    expect(pageRows(shown, { all: "1", rows: "60" })).toHaveLength(shown.length);
  });

  it("reads any other value as the first page, so ?all=0 is not all", () => {
    expect(pageRows(shown, { all: "0" })).toHaveLength(PAGE_ROWS);
    expect(pageRows(shown, { all: "yes" })).toHaveLength(PAGE_ROWS);
  });

  it("draws the rows ?rows= asks for, and never fewer than the first page", () => {
    expect(pageRows(shown, { rows: "60" })).toHaveLength(60);
    expect(pageRows(shown, { rows: "5" })).toHaveLength(PAGE_ROWS);
    expect(pageRows(shown, { rows: "sixty" })).toHaveLength(PAGE_ROWS);
    expect(pageRows(shown, { rows: "45.5" })).toHaveLength(PAGE_ROWS);
    expect(pageRows(shown, { rows: "500" })).toHaveLength(shown.length);
  });

  it("counts what it draws, so the sheet's Show N promises the board", () => {
    for (const query of [{}, { rows: "60" }, { rows: "500" }, { all: "1" }]) {
      expect(drawnCount(shown.length, query)).toBe(pageRows(shown, query).length);
    }
  });
});

describe("nextStep", () => {
  it("offers a page more while one is left", () => {
    expect(nextStep(100, {})).toEqual({ more: 30, rows: "60" });
    expect(nextStep(100, { rows: "60" })).toEqual({ more: 30, rows: "90" });
  });

  it("promises only what is left", () => {
    expect(nextStep(100, { rows: "90" })).toEqual({ more: 10, rows: "100" });
    expect(nextStep(41, {})).toEqual({ more: 11, rows: "41" });
  });

  it("offers nothing once every row is drawn", () => {
    expect(nextStep(30, {})).toBeNull();
    expect(nextStep(12, {})).toBeNull();
    expect(nextStep(100, { rows: "100" })).toBeNull();
    expect(nextStep(100, { all: "1" })).toBeNull();
  });
});

describe("litRows", () => {
  // Integration review, 20 Oct 2026: a 30-row page lit 11 orange where main's 100 lit 67, and its three 20s went yellow.
  const board = [20, 20, 20, ...Array.from({ length: 97 }, (_, at) => 19 - (at % 19))];
  const cut = (query: object) =>
    cutsFor([{ key: "acc" }], () => litRows(board, pageRows(board, query))).get("acc");

  it("cuts a short page over the first hundred, so its top three still wear the best ink", () => {
    expect(cut({})).toEqual(cut({ rows: "100" }));
    expect(cut({})?.best).toBe(20);
  });

  it("keeps a lit figure lit as Show N more pages in", () => {
    expect(cut({ rows: "60" })).toEqual(cut({}));
  });

  it("cuts over every row drawn past the hundred", () => {
    expect(litRows(board, pageRows(board, { all: "1" }))).toHaveLength(board.length);
    const long = Array.from({ length: 250 }, (_, at) => at);
    expect(litRows(long, pageRows(long, { all: "1" }))).toHaveLength(250);
  });
});
