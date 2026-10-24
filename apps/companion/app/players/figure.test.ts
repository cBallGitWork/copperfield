import { createElement } from "react";
import { describe, expect, it, vi } from "vitest";
import { DASH } from "@epl/core";
import { COLUMNS, DEFCON_POINTS, columnFor } from "./columns";
import { ATTRIBUTE_COLUMNS } from "./attributeColumns";
import { figureCell } from "./Cell";
import { figureOf } from "./figure";
import { shownRows } from "./query";
import { boardView } from "./views";
import type { PoolRow } from "./pool";

vi.mock("@/app/desk", () => import("../desk"));
vi.mock("@/app/components/shell/Link", () => ({ default: (props: object) => createElement("a", props) }));

// Craig, 21 Oct 2026, "yes dashes": a man with no minutes has no reading, so every figure dashes; one who played keeps his noughts.
const row = (id: string, points: number) =>
  ({
    entry: { player: { fantraxId: id, displayName: id, clubCode: "ARS" }, eligiblePositions: ["G"], status: "FA", ownerTeamId: null },
    stats: { points, perGame: 0 },
    fplCode: null,
  }) as unknown as PoolRow;

const rating = ATTRIBUTE_COLUMNS[0];
const UNPLAYED = { GP: 0, Min: 0, CS: 0, GA: 0, Sv: 0, GKP: 0, YC: 0, [DEFCON_POINTS]: 0, [`cm ${rating.title}`]: 14 };
const PLAYED = { GP: 1, Min: 90, CS: 0, GA: 0, Sv: 0, GKP: 0, YC: 0, [DEFCON_POINTS]: 0 };
const figures = COLUMNS.filter((column) => column.key !== "name" && column.group !== "attributes");

describe("a man with no minutes", () => {
  it("prints a dash in every figure column, FPts and FP/G included, toggle off or on", () => {
    for (const column of figures) {
      expect(figureCell(column, row("keeper", 0), UNPLAYED, false, undefined).value, column.key).toBe(DASH);
      expect(figureCell(column, row("keeper", 0), UNPLAYED, true, undefined).value, column.key).toBe(DASH);
    }
  });

  it("keeps his ratings, which are no season's reading", () => {
    expect(figureOf(rating, row("keeper", 0), UNPLAYED, false)).toBe(14);
  });

  it("reads a lone Min 0 or GP 0 as no reading too", () => {
    expect(figureOf(columnFor("fpts")!, row("keeper", 0), { Min: 0 }, false)).toBeNull();
    expect(figureOf(columnFor("fpts")!, row("keeper", 0), { GP: 0 }, false)).toBeNull();
  });
});

describe("a man who played", () => {
  it("keeps his noughts", () => {
    for (const key of ["fpts", "cs", "ga", "sv", "gkp", "yc"])
      expect(figureCell(columnFor(key)!, row("keeper", 0), PLAYED, false, undefined).value, key).toBe("0");
    expect(figureCell(columnFor("dcp")!, row("keeper", 0), PLAYED, false, undefined).value).toBe("0.00");
  });

  it("is read as before where the read carries no minutes", () => {
    expect(figureOf(columnFor("fpts")!, row("keeper", 3), undefined, false)).toBe(3);
  });
});

describe("the sort", () => {
  const rows = [row("unplayed", 0), row("blank", 0), row("scored", 4)];
  const raw = new Map<string, Record<string, number | null>>([
    ["unplayed", UNPLAYED],
    ["blank", PLAYED],
    ["scored", { ...PLAYED, CS: 1, [DEFCON_POINTS]: 2 }],
  ]);
  const order = (sort: string, dir: string) =>
    shownRows(rows, { sort, dir, status: "all" }, raw, boardView("pool", {})).map((shown) => shown.entry.player.fantraxId);

  it("puts the unplayed man after every reading, both ways", () => {
    for (const sort of ["fpts", "cs", "min", "dcp"]) {
      expect(order(sort, "desc").at(-1), sort).toBe("unplayed");
      expect(order(sort, "asc").at(-1), sort).toBe("unplayed");
    }
  });
});

describe("DCP takes the board's lights", () => {
  // Craig, 21 Oct 2026, "DCP yes lose it": cyan on Players is FPts alone.
  const dcp = columnFor("dcp")!;
  const cell = (points: number) => figureCell(dcp, {} as never, { Min: 900, [DEFCON_POINTS]: points * 10 }, false, { good: 4, best: 8 });

  it("lights a standout like any figure, and leaves the rest in plain ink", () => {
    expect(cell(9).className).toBe("cm-lit-best font-bold text-peak");
    expect(cell(5).className).toBe("cm-lit-good font-bold text-accent");
    expect(cell(2).className).toBe("");
  });

  it("leaves FPts the board's only cyan", () => {
    expect(figures.filter((column) => figureCell(column, { stats: { points: 9 } } as never, { Min: 900 }, false, undefined).className === "text-info").map((column) => column.key)).toEqual(["fpts"]);
  });
});
