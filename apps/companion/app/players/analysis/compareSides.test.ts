import { describe, expect, it, vi } from "vitest";
import type { PastSeason } from "@epl/core";
import type { LeaguePool } from "../pool";
import { DATA_COMPARE, playerCompare } from "./compareRoute";

const read = vi.hoisted(() => ({ subject: vi.fn(), careerOf: vi.fn() }));
vi.mock("../[fantraxId]/subject", () => ({ subject: read.subject }));
vi.mock("./pastSides", () => ({ careerOf: read.careerOf }));

import { askedSides, rivalNamed } from "./compareSides";

const season = (label: string) => ({ season: label, minutes: 900 }) as PastSeason;

describe("askedSides", () => {
  it("opens his own Compare on his last season, A fixed whatever the query says", async () => {
    read.subject.mockResolvedValue({ intel: {}, football: {}, ownerName: null });
    read.careerOf.mockResolvedValue([season("2025/26"), season("2024/25")]);
    expect(await askedSides({ a: "09zz9", qa: "sal" }, playerCompare("061vq"), "04ab1")).toEqual({
      a: "061vq", b: "061vq", qa: "", qb: "", as: undefined, bs: "2025-26",
    });
  });

  it("opens on the rival for a man with no past season", async () => {
    read.careerOf.mockResolvedValue([]);
    expect((await askedSides({}, playerCompare("061vq"), "04ab1")).b).toBe("04ab1");
  });

  it("reads no career when the query already names B", async () => {
    read.careerOf.mockClear();
    expect((await askedSides({ b: "09zz9" }, playerCompare("061vq"), "04ab1")).b).toBe("09zz9");
    expect(read.careerOf).not.toHaveBeenCalled();
  });

  it("leaves Data's Compare to the query", async () => {
    expect(await askedSides({ a: "061vq", b: ["x", "04ab1"] }, DATA_COMPARE, undefined)).toEqual({
      a: "061vq", b: "04ab1", qa: "", qb: "", as: undefined, bs: undefined,
    });
  });
});

describe("rivalNamed", () => {
  it("names the rival as a phone list does, and nobody off a silent pool", () => {
    const pool = { rows: [{ entry: { player: { fantraxId: "04ab1", displayName: "Erling Haaland" } } }] } as unknown as LeaguePool;
    expect(rivalNamed(pool, "04ab1")).toEqual({ id: "04ab1", name: "E. Haaland" });
    expect(rivalNamed({ unavailable: "x" } as LeaguePool, "04ab1")).toBeUndefined();
    expect(rivalNamed(pool, undefined)).toBeUndefined();
  });
});
