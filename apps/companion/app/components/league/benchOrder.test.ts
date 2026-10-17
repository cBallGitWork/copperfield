import { describe, expect, it } from "vitest";
import { benchFrom, orderAfter, orderBench, swapInOrder } from "./benchOrder";

describe("benchFrom", () => {
  it("takes Fantrax's ranks first, then anyone unranked in the order the bench stands", () => {
    expect(benchFrom({ dia: 1, wie: 2, gone: 3 }, ["sch", "wie", "bra", "dia"])).toEqual(["dia", "wie", "sch", "bra"]);
  });

  it("keeps the bench as it stands when Fantrax holds no order", () => {
    expect(benchFrom({}, ["sch", "wie"])).toEqual(["sch", "wie"]);
  });

  it("ignores a rank of nought, which Fantrax uses for a man taken out of the order", () => {
    expect(benchFrom({ wie: 0, dia: 1 }, ["wie", "dia"])).toEqual(["dia", "wie"]);
  });
});

describe("orderBench", () => {
  it("follows the order, drops who has left the bench and appends who has joined it", () => {
    expect(orderBench(["b", "a", "gone"], ["a", "b", "new"])).toEqual(["b", "a", "new"]);
  });
});

describe("swapInOrder", () => {
  it("swaps two men's places", () => {
    expect(swapInOrder(["a", "b", "c"], "a", "c")).toEqual(["c", "b", "a"]);
  });

  it("leaves the order alone when either is not in it", () => {
    expect(swapInOrder(["a", "b"], "a", "z")).toEqual(["a", "b"]);
  });
});

describe("orderAfter", () => {
  it("puts the starter coming off in the bench place of the man going on (Ndoye for Foden, GW7)", () => {
    const order = orderAfter(["elanga", "foden", "minteh"], { kind: "swap", fantraxId: "foden", withId: "ndoye", to: "M" });
    expect(orderBench(order, ["elanga", "minteh", "ndoye"])).toEqual(["elanga", "ndoye", "minteh"]);
  });

  it("keeps each sub's place through two swaps in a row", () => {
    const once = orderAfter(["elanga", "foden", "minteh"], { kind: "swap", fantraxId: "foden", withId: "ndoye", to: "M" });
    const twice = orderAfter(once, { kind: "swap", fantraxId: "minteh", withId: "foden", to: "F" });
    expect(orderBench(twice, ["elanga", "ndoye", "foden"])).toEqual(["elanga", "ndoye", "foden"]);
  });

  it("leaves the order alone on a move with nobody going to the bench", () => {
    expect(orderAfter(["a", "b"], { kind: "promote", fantraxId: "b", to: "M" })).toEqual(["a", "b"]);
  });
});
