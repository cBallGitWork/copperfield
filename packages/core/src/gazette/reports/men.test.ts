import { describe, expect, it } from "vitest";
import type { PlSquadMan, PlTeamSheet } from "../../football/premierleague/teamSheet";
import { PALMER, SAKA, heldBy, matchInput, moment, reportMan } from "./__fixtures__/built";
import { manLine } from "./briefLines";
import { keyStats } from "./keyStats";
import { lineupOf } from "./lineups";
import { reportMen } from "./men";
import { manCounts, matchEvents } from "./timeline";
import type { ReportMan } from "./types";

const squad = (code: number, name: string): PlSquadMan => ({ code, name, shirt: null, position: "M", captain: false });
const sheet = (lineup: PlSquadMan[], substitutes: PlSquadMan[] = []): PlTeamSheet => ({ teamId: 1, lineup, substitutes, formation: null, shape: null });
const noExtras = { live: new Map(), season: null, holders: new Map(), dropped: new Map(), points: new Map(), defensive: new Map(), defensiveMost: new Map(), fitness: new Map(), nameParts: new Map() };

describe("a man sent off", () => {
  const moments = [moment("55", "sent-off", [1, null])];
  const men = reportMen({ home: sheet([squad(1, "William Saliba")]), away: sheet([squad(3, "Cole Palmer")]) }, moments, noExtras);
  const events = matchEvents(matchInput(men, moments, [0, 0]));

  it("is told as sent off, never as taken off", () => {
    expect(men[0]).toMatchObject({ offAt: "55", sentOff: true, injuredOff: false });
    expect(manLine(matchInput(men, moments, [0, 0]), men[0], manCounts(events, men).get(1), events)).toBe("was sent off");
  });
});

describe("manLine", () => {
  const line = (over: Partial<ReportMan>, moments = [moment("10", "goal", [3, null])], score: [number, number] = [0, 1]) => {
    const man = reportMan(1, "William Saliba", "home", { line: "D", ...over });
    const match = matchInput([man, PALMER], moments, score);
    const events = matchEvents(match);
    return manLine(match, man, manCounts(events, match.men).get(1), events);
  };

  it("says a start or a change only when it is news: a first league start, off before the hour", () => {
    expect(line({})).toBe("");
    expect(line({ offAt: "55" })).toBe("was taken off before the hour");
    expect(line({ offAt: "75" })).toBe("");
    expect(line({ startsBefore: 0, matchesBefore: 5, holder: heldBy("Notemail") })).toBe("his first league start this season");
  });

  it("leaves a free agent's first league start to his stake", () => {
    expect(line({ startsBefore: 0, matchesBefore: 5 })).toBe("");
  });

  it("gives the chances good enough to score of a man who did not, his defensive points, and a whole match without conceding", () => {
    expect(line({ expectedGoals: 0.6, defensive: 2 })).toBe("chances good enough to score; two defensive points");
    expect(line({}, [], [0, 0])).toBe("the whole match without conceding");
  });

  it("hands defensive points over as points the league pays, with the most a match pays, never as a count of actions", () => {
    expect(line({ defensive: 1, defensiveMost: 2 })).toBe("one defensive point (most a match pays two)");
    expect(line({ defensive: 2, defensiveMost: 2 })).toBe("two defensive points (most a match pays two)");
  });
});

describe("lineupOf with a substitute replaced in turn", () => {
  const moments = [moment("60", "substitution", [2, 1]), moment("80", "substitution", [6, 2], { injury: true })];
  const lineup = lineupOf(sheet([squad(1, "Bukayo Saka")], [squad(2, "Noni Madueke"), squad(6, "Ethan Nwaneri"), squad(7, "Myles Lewis-Skelly")]), moments);

  it("keeps the man who came on for the substitute, under him", () => {
    expect(lineup.lines[0][0].replacedBy).toEqual({ name: "Madueke", minute: "60", booked: false, replacedBy: { name: "Nwaneri", minute: "80", booked: false } });
    expect(lineup.unused).toEqual(["Lewis-Skelly"]);
  });
});

describe("keyStats' woodwork", () => {
  it("names a man who hit it twice once", () => {
    const match = matchInput([SAKA, PALMER], [moment("10", "woodwork", [1, null]), moment("50", "woodwork", [1, null])], [0, 0]);
    const events = matchEvents(match);
    expect(keyStats(match, events, manCounts(events, match.men), 9, null).find((k) => k.label === "Hit the woodwork")?.value).toBe("Saka");
  });
});
