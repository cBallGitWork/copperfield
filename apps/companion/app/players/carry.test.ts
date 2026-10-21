import { describe, expect, it } from "vitest";
import { carriedHref } from "./carry";
import { POOL, STATS, TEAMS } from "./routes";

// P-13: the strip's Adv Stats link was a bare `/players/stats`, so a search for Saka among defenders was lost.
describe("what a Data view's strip link carries", () => {
  const search = new URLSearchParams("q=Saka&pos=D,M&status=FA&club=ARS&sort=fpts&dir=asc&group=creating&rows=60&panel=1&per=90");

  it("hands the other pool board the search, positions, status and club, and nothing of its own", () => {
    expect(carriedHref(STATS, "pool", "stats", search)).toBe(`${STATS}?q=Saka&pos=D%2CM&status=FA&club=ARS`);
    expect(carriedHref(POOL, "stats", "pool", search)).toBe(`${POOL}?q=Saka&pos=D%2CM&status=FA&club=ARS`);
  });

  it("leaves a board that reads none of them bare, either way", () => {
    expect(carriedHref(TEAMS, "pool", "teams", search)).toBe(TEAMS);
    expect(carriedHref(STATS, "teams", "stats", new URLSearchParams("group=attack&sort=sh"))).toBe(STATS);
  });

  it("leaves the plate on screen bare, and a blank or absent filter out", () => {
    expect(carriedHref(POOL, "pool", "pool", search)).toBe(POOL);
    expect(carriedHref(STATS, "pool", "stats", new URLSearchParams("q=&sort=g"))).toBe(STATS);
  });

  it("takes the last of a repeated field, as the board does", () => {
    expect(carriedHref(STATS, "pool", "stats", new URLSearchParams("q=Saka&q=Rice"))).toBe(`${STATS}?q=Rice`);
  });
});
