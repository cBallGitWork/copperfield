import type { Club } from "../../../football/types";
import type { ReportDayInput, ReportMan, ReportMatchInput } from "../types";
import { heldBy, reportMan, tieWith } from "./built";
import { CHELSEA_BOURNEMOUTH, COVENTRY_NEWCASTLE, HULL_EVERTON, LIVERPOOL_CITY, PALACE_FOREST } from "./gw6";

// Gameweek 6's league side, from the real league on 10 and 11 Oct 2026: who had each man, his points that day, this
// gameweek's claims and drops, and the head-to-heads as they stood. Men nobody named here played as free agents for nothing.

type Tie = readonly [opponent: string, us: number, them: number];
const has = (team: string, points: number, [opponent, us, them]: Tie, over: Partial<NonNullable<ReportMan["holder"]>> = {}): Partial<ReportMan> => ({
  points, holder: heldBy(team, [tieWith(opponent, us, them)], over),
});
const benched = (team: string, points: number, h2h: Tie) => has(team, points, h2h, { fielded: false });

const RACCOONS: Tie = ["domeitalycoach", 47, 31];
const DOME: Tie = ["The Raccoons", 31, 47];
const COWS: Tie = ["The Truffle Pigs", 44, 44];
const PIGS: Tie = ["Cowthenbeef", 44, 44];
const GLENGARRY: Tie = ["Bayern Bru", 31, 41];
const BAYERN: Tie = ["GlengarryHearts", 41, 31];

function league(match: ReportMatchInput, code: number, men: Record<string, Partial<ReportMan>>, marks: Record<string, number> = {}, extra: ReportMan[] = []): ReportMatchInput {
  const all = [...match.men, ...extra].map((m) => ({ ...m, points: 0, ...men[m.name] }));
  return { ...match, fixture: { ...match.fixture, id: code, code }, men: all, marks: new Map(all.flatMap((m) => (marks[m.name] === undefined ? [] : [[m.code, marks[m.name]] as const]))) };
}

// Liverpool's first defeat of the season, as on the day, so this match leads the page.
const LIVERPOOL: Club = { id: 101, code: 1001, name: "Liverpool", shortName: "LIV" };
const CITY: Club = { id: 102, code: 1002, name: "Manchester City", shortName: "MCI" };
const ANFIELD = { ...LIVERPOOL_CITY, home: { ...LIVERPOOL_CITY.home, code: LIVERPOOL.code }, away: { ...LIVERPOOL_CITY.away, code: CITY.code } };
const WON = { ...LIVERPOOL_CITY.fixture, id: 90, code: 90, homeClubId: LIVERPOOL.id, awayClubId: 1, homeScore: 1, awayScore: 0 };

export const LIVERPOOL_CITY_LEAGUE = league({ ...ANFIELD, fixture: { ...ANFIELD.fixture, homeClubId: LIVERPOOL.id, awayClubId: CITY.id, kickoff: "2026-10-11T15:30:00Z" } }, 1, {
  "Jérémy Doku": { points: 8, dropped: { team: "domeitalycoach", day: "Wednesday" } },
  "Rayan Cherki": has("Cowthenbeef", 8, COWS),
  "Elliot Anderson": has("GlengarryHearts", 7, GLENGARRY),
  "Marc Guéhi": has("Bayern Bru", 6, BAYERN),
  "Erling Haaland": has("The Raccoons", 6, RACCOONS),
  "Gianluigi Donnarumma": has("domeitalycoach", 8, DOME),
  "Jérémy Jacquet": benched("The Truffle Pigs", 3, PIGS),
  "Alisson Becker": has("The Truffle Pigs", 1, PIGS),
}, { "Jérémy Doku": 8, "Rayan Cherki": 7.9, "Elliot Anderson": 7.4, "Gianluigi Donnarumma": 7.4 }, [reportMan(99, "Marc Guéhi", "away", { line: "D" })]);

export const PALACE_FOREST_LEAGUE = league(PALACE_FOREST, 2, {
  "Daichi Kamada": benched("The Truffle Pigs", 8, PIGS),
  "Jefferson Lerma": { points: 8, startsBefore: 0, matchesBefore: 5 },
  "Quinten Timber": { points: 7 },
  "Yéremy Pino": benched("domeitalycoach", 6, DOME),
  "Dan Ndoye": has("AtleticoTimHortons", 6, ["Hazza Maguazza's Redempshazza", 43, 27]),
  "Adam Wharton": has("Bayern Bru", 5, BAYERN),
});

export const HULL_EVERTON_LEAGUE = league(HULL_EVERTON, 3, {
  "Kiernan Dewsbury-Hall": has("The Raccoons", 11, RACCOONS),
  "Ainsley Maitland-Niles": has("domeitalycoach", 5, DOME, { since: "Wednesday" }),
  "Sorba Thomas": { points: 7 },
  "Joe Gelhardt": { points: 7 },
  "Thierno Barry": has("The Truffle Pigs", 6, PIGS),
});

export const CHELSEA_BOURNEMOUTH_LEAGUE = league(CHELSEA_BOURNEMOUTH, 4, {
  "Jordan Henderson": { points: 16 },
  "João Pedro": has("Cowthenbeef", 10, COWS),
  "Pep Chavarría": { points: 5, dropped: { team: "Cowthenbeef", day: "Saturday" } },
  "Cole Palmer": has("The Raccoons", 9, RACCOONS),
  "Morgan Rogers": has("If anyone can, Bannan can", 9, ["its_ohi", 32, 40]),
  "Evanilson": has("If anyone can, Bannan can", 7, ["its_ohi", 32, 40]),
});

// Monday's one match, where hardly anyone is owned: on the day it printed 11 one-man sections.
export const COVENTRY_NEWCASTLE_LEAGUE = league(COVENTRY_NEWCASTLE, 5, {
  "Sidiki Cherif": { points: 9, startsBefore: 0, matchesBefore: 5 },
  "Jack Rudoni": { points: 7 },
  "Brandon Thomas-Asante": { points: 6, defensive: 1, defensiveMost: 2 },
  "Sven Botman": { points: 6 },
  "Nico González": { points: 6, defensive: 1, defensiveMost: 2 },
  "Jay Dasilva": { points: 5 },
  "Ellis Simms": { points: 5 },
  "Milan van Ewijk": { points: 6, defensive: 2, defensiveMost: 2 },
  "Caleb Yirenkyi": { points: 4, defensive: 2, defensiveMost: 2 },
  "Bobby Thomas": { points: 4, defensive: 2, defensiveMost: 2 },
  "Carl Rushworth": { points: 3 },
  "Stephen Mfuni": { points: null },
  "Lewis Hall": has("Cowthenbeef", 2, COWS),
}, { "Sidiki Cherif": 8 });

const CLUBS: Club[] = [{ id: 1, code: 11, name: "Home", shortName: "HOM" }, { id: 2, code: 22, name: "Away", shortName: "AWA" }, LIVERPOOL, CITY];

/** A day's page of these matches. */
export const gw6Day = (matches: ReportMatchInput[]): ReportDayInput => ({ day: "2026-10-11", gameweek: 6, matches, season: [WON, ...matches.map((m) => m.fixture)], clubs: CLUBS, keeperRung: 3 });
