import { describe, expect, it } from "vitest";
import { activeSort, boardHref, isChosen, isFiltered, playersQuery, shownRows as shownOn } from "./query";
import { wayOut } from "./wayOut";
import type { PoolRow } from "./pool";
import { boardView } from "./views";

const PLAYERS = boardView("pool", {});
// A league that scores no goals, so G sits on Adv Stats.
const STATS = boardView("stats", { other: { code: "ZZ" } } as never);
const shownRows = (rows: readonly PoolRow[], query: Parameters<typeof shownOn>[1], raw: Parameters<typeof shownOn>[2]) =>
  shownOn(rows, query, raw, PLAYERS);

const player = (
  fantraxId: string,
  positions: string[],
  status: string,
  name = fantraxId,
): PoolRow =>
  ({
    entry: {
      player: { fantraxId, displayName: name, rawName: name, clubCode: "ARS", position: null, rotowireId: null },
      eligiblePositions: positions,
      status,
      ownerTeamId: null,
    },
    stats: null,
    fplCode: null,
  }) as unknown as PoolRow;

const NOBODY = new Map<string, Record<string, number | null>>();

describe("isFiltered", () => {
  it("is off for a bare search, so an empty board does not send him to a filter he never set", () => {
    expect(isFiltered({ q: "zzzz", sort: "fpts", group: "attacking", per: "90" })).toBe(false);
  });

  it("is on for a position, a status or a club", () => {
    expect(isFiltered({ pos: "D", status: "all" })).toBe(true);
    expect(isFiltered({ status: "FA" })).toBe(true);
    expect(isFiltered({ club: "ARS", status: "all" })).toBe(true);
    expect(isFiltered({ pos: "", club: " ", status: "all" })).toBe(false);
  });

  it("counts the resting free men as a filter, since they narrow the board", () => {
    expect(isFiltered({})).toBe(true);
  });
});

describe("isChosen", () => {
  it("is on for a value in the list and off for one merely containing it", () => {
    expect(isChosen({ pos: "D,M" }, "pos", "M")).toBe(true);
    // "M" must not match inside "MID" — a substring test would light the wrong chip.
    expect(isChosen({ pos: "MID" }, "pos", "M")).toBe(false);
  });
});

describe("shownRows", () => {
  const pool = [
    player("a", ["D"], "FA"),
    player("b", ["M"], "FA"),
    player("c", ["F"], "WW"),
    player("d", ["D", "M"], "T"),
  ];

  const ids = (query: Parameters<typeof shownRows>[1], rows = pool) =>
    shownRows(rows, query, NOBODY).map((row) => row.entry.player.fantraxId).sort();

  it("rests on the free men, FA and WW, when nothing is chosen (Craig, 16 Oct 2026)", () => {
    expect(ids({})).toEqual(["a", "b", "c"]);
  });

  it("shows everyone for status=all", () => {
    expect(ids({ status: "all" })).toEqual(["a", "b", "c", "d"]);
  });

  it("searches everyone, whatever the board rests on, so a typed name finds a man somebody holds", () => {
    const named = [player("s", ["M"], "T", "Bukayo Saka"), player("w", ["D"], "FA", "Tom Saka")];
    expect(ids({ q: "saka" }, named)).toEqual(["s", "w"]);
  });

  it("keeps a status the reader pressed under a search", () => {
    const named = [player("s", ["M"], "T", "Bukayo Saka"), player("w", ["D"], "FA", "Tom Saka")];
    expect(ids({ q: "saka", status: "FA" }, named)).toEqual(["w"]);
  });

  it("unions within one filter — a defender OR a midfielder", () => {
    const shown = shownRows(pool, { pos: "D,M", status: "all" }, NOBODY).map((row) => row.entry.player.fantraxId);
    expect(shown.sort()).toEqual(["a", "b", "d"]);
  });

  it("intersects between filters — a midfielder who is also a free agent", () => {
    const shown = shownRows(pool, { pos: "D,M", status: "FA" }, NOBODY).map(
      (row) => row.entry.player.fantraxId,
    );
    expect(shown.sort()).toEqual(["a", "b"]);
  });

  it("keeps a man eligible at either of two chosen positions once", () => {
    // `d` is D and M, and both are chosen. A filter that returned him twice
    // would be a directory that grew as you narrowed it.
    const shown = shownRows([player("d", ["D", "M"], "T")], { pos: "D,M", status: "all" }, NOBODY);
    expect(shown).toHaveLength(1);
  });

  it("finds a man however his name is typed: accents, apostrophes, hyphens and spaces fold", () => {
    const names = [player("o", ["M"], "T", "Martin Odegaard"), player("r", ["D"], "T", "Nico OReilly")];
    const ids = (q: string) => shownRows(names, { q }, NOBODY).map((row) => row.entry.player.fantraxId);
    expect(ids("Ødegaard")).toEqual(["o"]);
    expect(ids("O’Reilly")).toEqual(["r"]);
  });

  it("finds a man however his name is typed: initialled, surname first, or FPL's glued shirt name", () => {
    const names = [
      player("s", ["M"], "T", "Bukayo Saka"),
      player("w", ["D"], "FA", "Aaron Wan-Bissaka"),
      player("f", ["M"], "T", "Bruno Fernandes"),
    ];
    const ids = (q: string) => shownRows(names, { q }, NOBODY).map((row) => row.entry.player.fantraxId);
    expect(ids("B. Saka")).toEqual(["s"]);
    expect(ids("saka bukayo")).toEqual(["s"]);
    expect(ids("B.Fernandes")).toEqual(["f"]);
  });

  it("leaves out men the league holds no status for, while any man has one", () => {
    const ids = (rows: PoolRow[]) => shownRows(rows, { status: "all" }, NOBODY).map((row) => row.entry.player.fantraxId);
    expect(ids([player("a", ["D"], "FA"), player("x", [], "")])).toEqual(["a"]);
    // A league whose statuses did not arrive still lists its pool rather than an empty board.
    expect(ids([player("x", [], ""), player("y", [], "")])).toEqual(["x", "y"]);
  });
});

describe("activeSort", () => {
  it("reads a direction it does not know as the column's own", () => {
    expect(activeSort({ sort: "fpts", dir: "x" }, PLAYERS)).toEqual(activeSort({ sort: "fpts" }, PLAYERS));
    expect(activeSort({ sort: "fpts", dir: "asc" }, PLAYERS).descending).toBe(false);
  });

  it("falls to the board's own default for a column it does not draw", () => {
    expect(activeSort({ sort: "fin" }, PLAYERS).column.key).toBe("fpts");
    expect(activeSort({ sort: "fpts" }, boardView("stats", {})).column.key).toBe("xg");
    expect(activeSort({ sort: "fin" }, boardView("stats", {})).column.key).toBe("fin");
  });
});

describe("a page's rows in the query", () => {
  it("reads ?rows= as the last value given, as every field is", () => {
    expect(playersQuery({ rows: ["30", "60"] }).rows).toBe("60");
  });

  it("keeps a step for a sort and drops it for Show all and for a way off an emptied board", () => {
    expect(boardHref({ rows: "60" }, { sort: "g", dir: "desc" })).toBe("/players?rows=60&sort=g&dir=desc");
    expect(boardHref({ rows: "60" }, { all: "1" })).toBe("/players?all=1");
    expect(wayOut({ rows: "60", pos: "D" })?.href).toBe("/players?status=all");
  });
});

describe("shownRows floors", () => {
  const free = (id: string, perGame: number) => ({ ...player(id, ["M"], "FA"), stats: { perGame } }) as unknown as PoolRow;
  const order = (query: Parameters<typeof shownOn>[1], rows: PoolRow[], raw: Map<string, Record<string, number | null>>, board = PLAYERS) =>
    shownOn(rows, query, raw, board).map((row) => row.entry.player.fantraxId);

  it("sinks a 9.50 on two games below every man past three, either way the column runs (21 Oct 2026)", () => {
    const rows = [free("cameo", 9.5), free("regular", 6), free("steady", 4)];
    const raw = new Map([
      ["cameo", { GP: 2 }],
      ["regular", { GP: 7 }],
      ["steady", { GP: 7 }],
    ]);
    expect(order({ sort: "fpg" }, rows, raw)).toEqual(["regular", "steady", "cameo"]);
    expect(order({ sort: "fpg", dir: "asc" }, rows, raw)).toEqual(["steady", "regular", "cameo"]);
  });

  it("sinks a per-90 under 270 minutes, but above a man with no reading", () => {
    const rows = [free("cameo", 0), free("regular", 0), free("none", 0)];
    const raw = new Map<string, Record<string, number | null>>([
      ["cameo", { Min: 120, G: 2 }],
      ["regular", { Min: 900, G: 3 }],
      ["none", { Min: 900, G: null }],
    ]);
    // Adv Stats is per 90 unless asked otherwise (Craig, 24 Oct 2026): the cameo sinks either way the column runs.
    expect(order({ sort: "g" }, rows, raw, STATS)).toEqual(["regular", "cameo", "none"]);
    expect(order({ sort: "g", dir: "asc" }, rows, raw, STATS)).toEqual(["regular", "cameo", "none"]);
    // Off the toggle, and always on Players, the counts sort as counts, his two goals under three.
    expect(order({ sort: "g", dir: "asc", per: "total" }, rows, raw, STATS)).toEqual(["cameo", "regular", "none"]);
    expect(order({ sort: "g", dir: "asc", per: "90" }, rows, raw)).toEqual(["cameo", "regular", "none"]);
  });
});
