import { describe, expect, it } from "vitest";
import { fitnessNote, gameweekStarts, returnWeek, SEASON_OUT_GW, weekOfDate, type NoteCalendar } from "./fitnessNote";

const man = (status: string, chanceOfPlaying: number | null, news: string, code = 1) => ({ code, status, chanceOfPlaying, news });
const weeks = (week: number | null, code = 1) => new Map([[code, { expectedReturnGw: week }]]);
const none = new Map<number, { expectedReturnGw: number | null }>();
/** GW8 is open: its lineups are being picked. Each gameweek starts on a Saturday a week apart (GW8 24 Oct). */
const OPEN = 8;
const STARTS = [[7, "2026-10-17"], [8, "2026-10-24"], [9, "2026-10-31"], [10, "2026-11-07"], [11, "2026-11-21"]] as const;
const cal = (open: number | null = OPEN): NoteCalendar => ({ open, starts: STARTS });
const text = (player: ReturnType<typeof man> | null, held: Parameters<typeof fitnessNote>[1], open: number | null = OPEN) => {
  const note = fitnessNote(player, held, cal(open));
  return note === null ? null : note.back === null ? note.word : `${note.word} · ${note.back}`;
};

describe("fitnessNote", () => {
  // Craig, 22 Oct 2026: "don't put percentages in this row"; "suspended rows … put back gwx".
  it("never prints a chance: a doubt is his complaint, and his week when one is known", () => {
    expect(text(man("d", 75, "Back injury - 75% chance of playing"), none)).toBe("Back injury");
    expect(fitnessNote(man("d", 75, "Back injury - 75% chance of playing"), weeks(null), cal())).toEqual({ word: "Back injury", back: null });
    expect(text(man("d", 75, "Ankle injury - 75% chance of playing"), weeks(9))).toBe("Ankle · GW9");
    expect(text(man("d", 25, "Lack of match fitness - 25% chance of playing"), none)).toBe("Doubt");
  });

  it("gives an injured man the squads export's week", () => {
    expect(text(man("i", 0, "Knee injury - Unknown return date"), weeks(10))).toBe("Knee · GW10");
  });

  it("drops a week at or below the open gameweek, and keeps it when the open gameweek is unknown", () => {
    expect(text(man("i", 0, "Knee injury - Unknown return date"), weeks(8))).toBe("Knee");
    expect(text(man("i", 0, "Knee injury - Unknown return date"), weeks(7))).toBe("Knee");
    expect(text(man("i", 0, "Knee injury - Unknown return date"), weeks(8), null)).toBe("Knee · GW8");
  });

  it("turns a ban's 'Suspended until' date into the gameweek it opens", () => {
    expect(text(man("s", 0, "Suspended until 31 Oct"), none)).toBe("Suspended · GW9");
    expect(text(man("s", 0, "Suspended until 1 Nov"), none)).toBe("Suspended · GW10");
    expect(text(man("s", 0, "Suspended until 31 Oct"), weeks(10))).toBe("Suspended · GW10");
  });

  it("turns FPL's 'Expected back' date into a gameweek when the export has none, never the date itself", () => {
    expect(text(man("i", 0, "Hamstring injury - Expected back 1 Nov"), none)).toBe("Hamstring · GW10");
    expect(text(man("i", 0, "Hamstring injury - Expected back 25 Oct"), none)).toBe("Hamstring · GW9");
    expect(text(man("i", 0, "Hamstring injury - Expected back 20 Oct"), none)).toBe("Hamstring");
  });

  it("prints only the complaint when the date falls past the calendar or there is none", () => {
    expect(text(man("i", 0, "Hamstring injury - Expected back 30 Nov"), none)).toBe("Hamstring");
    expect(fitnessNote(man("s", 0, "Suspended until 31 Oct"), none, { open: OPEN, starts: [] })?.back).toBeNull();
  });

  it("never reads a date out of free prose", () => {
    expect(text(man("i", 0, "Knee injury - back in December"), none)).toBe("Knee");
    expect(text(man("u", 0, "Has joined Oxford United on loan until January"), none)).toBe("On loan");
  });

  it("prints no week for a man who has left, whatever the export says", () => {
    expect(text(man("u", 0, "Has joined Al Hilal permanently"), weeks(999))).toBe("Left");
    expect(text(man("u", 0, "Has joined Al Hilal permanently"), weeks(12))).toBe("Left");
    expect(text(man("u", 0, "Has joined Rangers on loan for the rest of the season"), weeks(12))).toBe("On loan");
  });

  it("keeps a short complaint whole and gives a long one the state's word", () => {
    expect(text(man("d", 75, "Illness - 75% chance of playing"), none)).toBe("Illness");
    expect(text(man("i", 0, "Unspecified injury - Unknown return date"), none)).toBe("Injury");
    expect(text(man("u", 0, "not included in squad."), none)).toBe("Unavailable");
    expect(text(man("a", 75, ""), none)).toBe("Doubt");
  });

  it("is null for a fit man and one the bridge has not settled", () => {
    expect(fitnessNote(man("a", 100, ""), weeks(10), cal())).toBeNull();
    expect(fitnessNote(null, weeks(10), cal())).toBeNull();
  });

  it("reads another man's week as none", () => {
    expect(text(man("i", 0, "Knee injury - Unknown return date", 2), weeks(10, 1))).toBe("Knee");
  });
});

describe("weekOfDate", () => {
  it("rolls a date more than two months behind the open week into the next year", () => {
    const spring = { open: 25, starts: [[25, "2027-01-30"], [26, "2027-02-06"]] as const };
    expect(weekOfDate(1, "Feb", spring)).toBe(26);
    expect(weekOfDate(5, "Feb", spring)).toBe(26);
  });
});

describe("gameweekStarts", () => {
  it("takes each gameweek's first kickoff day and skips undated or unweeked fixtures", () => {
    const fixtures = [
      { gameweek: 9, kickoff: "2026-11-01T14:00:00Z" },
      { gameweek: 9, kickoff: "2026-10-31T11:30:00Z" },
      { gameweek: 8, kickoff: "2026-10-24T14:00:00Z" },
      { gameweek: null, kickoff: "2026-10-28T19:00:00Z" },
      { gameweek: 10, kickoff: null },
    ];
    expect(gameweekStarts(fixtures)).toEqual([[8, "2026-10-24"], [9, "2026-10-31"]]);
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
