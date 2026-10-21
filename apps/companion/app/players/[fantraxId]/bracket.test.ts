import { describe, expect, it } from "vitest";
import { bracket } from "./bracket";

const of = (ownerName: string | null, status: string) =>
  bracket({ ownerName, intel: { league: [{ label: "Status/Team", value: status }] } } as never);

describe("bracket", () => {
  it("holds his fantasy side when he is held", () => expect(of("Atletico", "T")).toBe("Atletico"));
  it("holds FA or WW for a man anybody can claim", () => {
    expect(of(null, "FA")).toBe("FA");
    expect(of(null, " WW ")).toBe("WW");
  });
  it("holds nothing for a status it does not know", () => expect(of(null, "")).toBeNull());
});
