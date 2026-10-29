import { describe, expect, it, vi } from "vitest";
import type { Fault } from "@epl/core";
import type { BinDesk } from "./binXi";

const columns: Record<string, unknown>[] = [];
vi.mock("./newsroom", async (actual) => ({ ...(await actual<typeof import("./newsroom")>()), writeColumn: async () => columns.shift() ?? {} }));
vi.mock("@epl/core", async (actual) => ({
  ...(await actual<typeof import("@epl/core")>()),
  checkBin: (column: Record<string, unknown>) => (column.faults as Fault[] | undefined) ?? [],
}));
const { writeBin } = await import("./binWriter");

const fault = (check: string, severity: Fault["severity"] = "send-back"): Fault => ({ section: "column", check, severity, evidence: "" });
const desk = { deck: "D", names: [], cargo: { total: 0 } } as unknown as BinDesk;

describe("writeBin", () => {
  it("keeps the rewrite when it ties the first on faults", async () => {
    columns.push({ take: 1, faults: [fault("a")] }, { take: 2, faults: [fault("b")] });
    const filed = await writeBin(desk, "B", () => {});
    expect(filed.take).toBe(2);
    expect(filed.deck).toBe("D");
  });

  it("keeps the first when the rewrite has more hard faults", async () => {
    columns.push({ take: 1, faults: [fault("a")] }, { take: 2, faults: [fault("b", "hard")] });
    expect((await writeBin(desk, "B", () => {})).take).toBe(1);
  });

  it("refuses to file a column still holding a hard fault", async () => {
    columns.push({ take: 1, faults: [fault("a", "hard")] }, { take: 2, faults: [fault("b", "hard")] });
    await expect(writeBin(desk, "B", () => {})).rejects.toThrow("The Bin XI failed its checks twice: b ()");
  });
});
