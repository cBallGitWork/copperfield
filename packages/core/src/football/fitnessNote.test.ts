import { describe, expect, it } from "vitest";
import { fitnessNote, fitnessNoteText, returnWeek, SEASON_OUT_GW } from "./fitnessNote";

const man = (status: string, chanceOfPlaying: number | null, news: string, code = 1) => ({ code, status, chanceOfPlaying, news });
const weeks = (week: number | null, code = 1) => new Map([[code, { expectedReturnGw: week }]]);
const none = new Map<number, { expectedReturnGw: number | null }>();
const text = (...args: Parameters<typeof fitnessNote>) => {
  const note = fitnessNote(...args);
  return note === null ? null : fitnessNoteText(note);
};

describe("fitnessNote", () => {
  it("gives a doubt with no return week his complaint and chance", () => {
    expect(text(man("d", 75, "Back injury - 75% chance of playing"), none)).toBe("Back · 75%");
    expect(fitnessNote(man("d", 75, "Back injury - 75% chance of playing"), weeks(null))).toEqual({ word: "Back", back: "75%" });
  });

  it("gives an injured man the squads export's week", () => {
    expect(text(man("i", 0, "Knee injury - Unknown return date"), weeks(10))).toBe("Knee · GW10");
  });

  it("prefers the week to a doubt's chance", () => {
    expect(text(man("d", 50, "Thigh injury - 50% chance of playing"), weeks(13))).toBe("Thigh · GW13");
  });

  it("gives a ban its word and week", () => {
    expect(text(man("s", 0, "Suspended until 31 Oct"), weeks(9))).toBe("Suspended · GW9");
    expect(text(man("s", 0, "Suspended until 31 Oct"), none)).toBe("Suspended");
  });

  it("never reads a date out of FPL's prose", () => {
    expect(text(man("i", 0, "Hamstring injury - Expected back 1 Nov"), none)).toBe("Hamstring");
  });

  it("prints no chance for a man who is out", () => {
    expect(text(man("i", 0, "Calf injury - Unknown return date"), none)).toBe("Calf");
  });

  it("keeps a short complaint whole and gives a long one the state's word", () => {
    expect(text(man("d", 75, "Illness - 75% chance of playing"), none)).toBe("Illness · 75%");
    expect(text(man("i", 0, "Unspecified injury - Unknown return date"), none)).toBe("Injury");
    expect(text(man("u", 0, "not included in squad."), none)).toBe("Unavailable");
    expect(text(man("d", 25, "Lack of match fitness - 25% chance of playing"), none)).toBe("Doubt · 25%");
  });

  it("names a move by its kind", () => {
    expect(text(man("u", 0, "Has joined Rangers on loan for the rest of the season"), none)).toBe("On loan");
    expect(text(man("u", 0, "Has joined Al Hilal permanently"), none)).toBe("Left");
  });

  it("gives a doubt with no news its state's word", () => {
    expect(text(man("a", 75, ""), none)).toBe("Doubt · 75%");
  });

  it("is null for a fit man and one the bridge has not settled", () => {
    expect(fitnessNote(man("a", 100, ""), weeks(10))).toBeNull();
    expect(fitnessNote(null, weeks(10))).toBeNull();
  });

  it("reads another man's week as none", () => {
    expect(text(man("i", 0, "Knee injury - Unknown return date", 2), weeks(10, 1))).toBe("Knee");
  });
});

describe("returnWeek", () => {
  it("passes a real gameweek and drops none, a nought and the season-out mark", () => {
    expect(returnWeek({ expectedReturnGw: 8 })).toBe(8);
    expect(returnWeek({ expectedReturnGw: null })).toBeNull();
    expect(returnWeek({ expectedReturnGw: 0 })).toBeNull();
    expect(returnWeek({ expectedReturnGw: SEASON_OUT_GW })).toBeNull();
    expect(returnWeek(undefined)).toBeNull();
  });
});
