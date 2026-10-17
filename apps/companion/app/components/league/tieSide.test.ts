import { describe, expect, it } from "vitest";
import { tieSide } from "./tieSide";

const places = new Map([["uexqrijomu8l5asi", "3rd"]]);

describe("a tie's side in the results row", () => {
  // Live cut 6 of 10 names at 390 and the schedule 174 of 404: the row draws `short` under a thumb.
  it("carries the league's short name for a phone, and the full one for the desk", () => {
    const side = tieSide({ team: { teamId: "uexqrijomu8l5asi" }, label: "AtleticoTimHortons" }, places, null);
    expect(side).toMatchObject({ name: "AtleticoTimHortons", short: "Atletico", place: "3rd" });
  });

  it("keeps a seat not yet drawn on its label", () => {
    const side = tieSide({ team: null, label: "Winner of tie 1" }, places, null);
    expect(side.short).toBeUndefined();
    expect(side.name).toBe("Winner of tie 1");
  });
});
