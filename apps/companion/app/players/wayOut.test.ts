import { describe, expect, it } from "vitest";
import { wayOut } from "./wayOut";

describe("wayOut", () => {
  it("searches everyone for a name a filter hid, keeping the search and the sort", () => {
    const out = wayOut({ q: "salah", status: "FA", pos: "F", club: "LIV", sort: "g", all: "1" });
    expect(out?.label).toBe("Search all players");
    expect(out?.href).toBe("/players?q=salah&status=all&sort=g");
  });

  it("clears the filters when there is no search, the resting free men among them", () => {
    expect(wayOut({ pos: "G", club: "ARS" })).toEqual({ label: "Clear filters", href: "/players?status=all" });
  });

  it("stays on the board it is on", () => {
    expect(wayOut({ pos: "G" }, "/players/stats")?.href).toBe("/players/stats?status=all");
  });

  it("offers nothing for a bare search no filter narrowed", () => {
    expect(wayOut({ q: "zzzz" })).toBeNull();
  });
});
