import { describe, expect, it } from "vitest";
import type { FootballPlayer } from "@epl/core";
import { initialled } from "@epl/core";
import { footballNamed } from "./poolName";
import type { PoolRow } from "./pool";

// Fantrax's spelling against FPL's, as the 16 Oct review found them: Gross on the pool, Groß on the squad list.
const fantrax = (rawName: string, displayName: string): PoolRow => ({
  entry: {
    player: { fantraxId: "x", rawName, displayName, clubCode: "BHA", position: "M", rotowireId: null },
    eligiblePositions: ["M"],
    status: "T",
    ownerTeamId: null,
    slot: null,
  },
  stats: null,
  fplCode: 1,
});

const fpl = (name: string, fullName: string) => ({ name, fullName }) as FootballPlayer;

describe("footballNamed", () => {
  it("names a man as the squad list does, on a desk and under a thumb", () => {
    const named = footballNamed(fantrax("Gross, Pascal", "Pascal Gross"), fpl("Groß", "Pascal Groß")).entry.player;
    expect([named.displayName, initialled(named.rawName)]).toEqual(["Pascal Groß", "P. Groß"]);
  });

  it("keeps the apostrophe and the accent Fantrax drops", () => {
    expect(footballNamed(fantrax("OReilly, Nico", "Nico OReilly"), fpl("O'Reilly", "Nico O'Reilly")).entry.player.displayName).toBe("Nico O'Reilly");
    expect(footballNamed(fantrax("Pedro, Joao", "Joao Pedro"), fpl("João Pedro", "João Pedro Junqueira de Jesus")).entry.player.displayName).toBe("João Pedro");
  });

  it("keeps Fantrax's name, both forms, where FPL's is another one", () => {
    const row = fantrax("Fernandes, Bruno", "Bruno Fernandes");
    expect(footballNamed(row, fpl("B.Fernandes", "Bruno Borges Fernandes"))).toBe(row);
  });

  it("leaves his id where it was", () => {
    expect(footballNamed(fantrax("Gross, Pascal", "Pascal Gross"), fpl("Groß", "Pascal Groß")).entry.player.fantraxId).toBe("x");
  });
});
