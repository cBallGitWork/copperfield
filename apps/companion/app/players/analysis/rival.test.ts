import { describe, expect, it } from "vitest";
import type { PoolRow } from "../pool";
import { defaultRival } from "./rival";

/** Just enough of a pool row for the rival: id, FPL code and who holds him. */
const row = (fantraxId: string, fplCode: number | null, ownerTeamId: string | null = "t1") =>
  ({ entry: { player: { fantraxId }, ownerTeamId }, stats: null, fplCode }) as unknown as PoolRow;

const GROUPS = new Map([[1, "forwards"], [2, "forwards"], [3, "forwards"], [4, "midfielders"], [5, "forwards"]]);
const groupOf = (code: number) => GROUPS.get(code) ?? null;

describe("defaultRival", () => {
  it("picks the man in his group with the nearest league points, never one from another group", () => {
    const rows = [row("a", 1), row("b", 2), row("c", 3), row("d", 4)];
    const points = new Map([[1, 50], [2, 30], [3, 58], [4, 51]]);
    expect(defaultRival(rows, "a", points, groupOf)).toBe("c");
  });

  it("gives a tie to a free agent, whoever comes first in the pool", () => {
    const rows = [row("a", 1), row("b", 2), row("c", 3, null)];
    const points = new Map([[1, 50], [2, 45], [3, 55]]);
    expect(defaultRival(rows, "a", points, groupOf)).toBe("c");
  });

  it("keeps pool order between two held men level on the gap", () => {
    const rows = [row("a", 1), row("b", 2), row("c", 3)];
    const points = new Map([[1, 50], [2, 45], [3, 55]]);
    expect(defaultRival(rows, "a", points, groupOf)).toBe("b");
  });

  it("never names himself, even level with himself", () => {
    const rows = [row("a", 1), row("b", 2)];
    const points = new Map([[1, 50], [2, 80]]);
    expect(defaultRival(rows, "a", points, groupOf)).toBe("b");
  });

  it("skips a man with no points to measure, and one FPL has never listed", () => {
    const rows = [row("a", 1), row("b", 2), row("x", null), row("c", 5)];
    const points = new Map<number, number | null>([[1, 50], [2, null], [5, 10]]);
    expect(defaultRival(rows, "a", points, groupOf)).toBe("c");
  });

  it("finds nobody for a man with no points, no group, or not in the pool", () => {
    const rows = [row("a", 1), row("b", 2), row("m", 9)];
    expect(defaultRival(rows, "a", new Map([[2, 40]]), groupOf)).toBeUndefined();
    expect(defaultRival(rows, "m", new Map([[9, 40], [2, 40]]), groupOf)).toBeUndefined();
    expect(defaultRival(rows, "z", new Map([[1, 40], [2, 40]]), groupOf)).toBeUndefined();
  });

  it("finds nobody when he is alone in his group", () => {
    expect(defaultRival([row("d", 4), row("a", 1)], "d", new Map([[4, 10], [1, 10]]), groupOf)).toBeUndefined();
  });
});
