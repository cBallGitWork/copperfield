import { describe, expect, it } from "vitest";
import { scorerPlayer } from "./scorer";

describe("scorerPlayer", () => {
  it("names him with Fantrax's own spellings", () => {
    const scorer = { scorerId: "x", name: "Bukayo Saka", posShortNames: "M,F", teamShortName: "ARS", teamName: "Arsenal" };
    expect(scorerPlayer("x", scorer)).toEqual({
      fantraxId: "x", playerName: "Bukayo Saka", position: "M,F", club: "ARS", clubName: "Arsenal",
    });
  });

  it("keeps a man with nothing but his id, name blank and the rest absent", () => {
    expect(scorerPlayer("x", {})).toEqual({ fantraxId: "x", playerName: "", position: null, club: null, clubName: null });
  });
});
