import { describe, expect, it } from "vitest";
import { rosterOrder } from "./order";

const line = (fantraxId: string) => ({ fantraxId });

describe("rosterOrder", () => {
  it("opens in the roster's order, not the stats read's", () => {
    // The read is Fantrax's outfield board by points, then the keepers: Leno came last below a man on 2.
    const read = [line("haaland"), line("palmer"), line("sarr"), line("leno")];
    expect(rosterOrder(read, ["leno", "palmer", "haaland", "sarr"]).map((each) => each.fantraxId)).toEqual([
      "leno",
      "palmer",
      "haaland",
      "sarr",
    ]);
  });

  it("keeps a man the read has and the roster lacks, at the foot, in the read's order", () => {
    const read = [line("x"), line("leno"), line("y")];
    expect(rosterOrder(read, ["leno"]).map((each) => each.fantraxId)).toEqual(["leno", "x", "y"]);
  });
});
