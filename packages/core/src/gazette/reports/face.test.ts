import { describe, expect, it } from "vitest";
import type { Club, FootballPlayer } from "../../football/types";
import type { StoryReport } from "./cargo";
import type { PublishedStory } from "../story";
import { reportFace, reportSubject, withReportFace } from "./face";

const man = (name: string, replacedBy: unknown = null) => ({ name, booked: false, sentOff: false, replacedBy });
const side = (code: number, goals: string[], names: string[], unused: string[] = []) => ({
  code, score: goals.length, goals, assists: [], manager: null, next: null,
  lineup: { formation: null, lines: [names.map((n) => man(n))], unused },
});
const report = (home: ReturnType<typeof side>, away: ReturnType<typeof side>) => ({ home, away }) as unknown as StoryReport;

// 10 Oct 2026's first two: Arsenal 2-1 Leeds (Guimarães's winner from Rice) and Chelsea's five.
const ARSENAL = report(
  side(3, ["Calafiori 62", "Guimarães 70"], ["Raya", "Calafiori", "Rice", "Guimarães"], ["Nwaneri"]),
  side(2, ["Justin 55"], ["Justin", "Gudmundsson"]),
);
const CHELSEA = report(side(8, ["Henderson 02", "Pedro 46", "Pedro 67", "Henderson 70", "James 80 og"], ["Pedro", "Henderson"]), side(91, [], ["O'Shea", "James"]));
const DAY = [ARSENAL, CHELSEA];

describe("reportSubject", () => {
  it("is the first man the headline names whose surname is a man's in the day's matches", () => {
    expect(reportSubject("Rice feeds Bruno winner", DAY)).toEqual({ name: "Rice", club: 3 });
    expect(reportSubject("Pedro's double sinks Cherries, Rice purrs", DAY)).toEqual({ name: "Pedro", club: 8 });
    expect(reportSubject("O’Shea stunned as GUIMARAES strikes", DAY)).toEqual({ name: "O'Shea", club: 91 });
  });

  it("never takes a word inside another, nor a man who did not play", () => {
    expect(reportSubject("Price of Nwaneri's bench", DAY)).toEqual({ name: "Henderson", club: 8 });
  });

  it("falls back to the day's top scorer, own goals aside, the earlier of two level", () => {
    expect(reportSubject("Gunners edge it", DAY)).toEqual({ name: "Henderson", club: 8 });
    expect(reportSubject("Gunners edge it", [ARSENAL])).toEqual({ name: "Calafiori", club: 3 });
    expect(reportSubject("Nothing doing", [])).toBeNull();
  });
});

describe("reportFace", () => {
  const clubs = [{ id: 1, code: 3 }, { id: 7, code: 8 }] as Club[];
  const player = (code: number, name: string, fullName: string, clubId: number) => ({ code, name, fullName, clubId }) as FootballPlayer;
  const players = [
    player(1001, "Jorginho", "Jorge Luiz Frello Filho Rice", 1), player(223340, "Rice", "Declan Rice", 1), player(1000, "Rice", "Someone Rice", 7),
    player(232223, "Henderson", "Liam Henderson", 7), player(444, "João Pedro", "João Pedro Junqueira de Jesus", 7),
  ];

  it("pictures the subject by his FPL code at his own club", () => {
    expect(reportFace("Rice feeds Bruno winner", DAY, players, clubs)).toEqual({ code: 223340, name: "Rice", clubId: 1, position: null });
    expect(reportFace("Gunners edge it", DAY, players, clubs)?.code).toBe(232223);
  });

  it("finds a printed name inside FPL's full one when neither his short name nor his surname is it", () => {
    expect(reportFace("Pedro's double", DAY, players, clubs)?.code).toBe(444);
  });

  it("pictures nobody when the subject is no footballer FPL lists at that club", () => {
    expect(reportFace("Justin's leveller", DAY, players, clubs)).toBeNull();
  });

  it("pictures a report filed with no face, keeps a stored one, and leaves every other kind alone", () => {
    const filed = { kind: "match-report", headline: "Rice feeds Bruno winner", face: null, extras: { reports: DAY } } as unknown as PublishedStory;
    expect(withReportFace(filed, { players, clubs }).face?.code).toBe(223340);
    const stored = { ...filed, face: { code: 9, name: "Saka", clubId: 1, position: null } };
    expect(withReportFace(stored, { players, clubs })).toBe(stored);
    const other = { ...filed, kind: "presser" } as PublishedStory;
    expect(withReportFace(other, { players, clubs })).toBe(other);
  });
});
