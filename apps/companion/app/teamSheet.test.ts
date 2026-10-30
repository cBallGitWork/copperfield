import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Fixture, FootballPlayer, FootballSnapshot, PlManMatch, RosteredTeam } from "@epl/core";
import type { ReadableSquads } from "./squads";
import { teamSheet } from "./teamSheet";

// #184: the head-to-head and the Team tab each built a team's sheet. On GW8 the Team tab drew 21 doubts and 30
// stories against 150 men the head-to-head drew clean; the head-to-head fixed its bench at kickoff, the Team tab at
// the lock.

const reads = vi.hoisted(() => ({
  locked: true,
  benchOrder: vi.fn<(team: string, period: number, locked: boolean) => Promise<string[]>>(async () => ["elanga"]),
  readPoolNews: vi.fn(async () => ({ mainoo: { headline: "Mainoo a doubt" } })),
  squadLivePoints: vi.fn(async () => ({ points: new Map([["mainoo", 0], ["elanga", 2]]), breakdown: {}, counted: {}, counts: {}, played: { mainoo: 90 } })),
  matchManEvents: vi.fn(async () => new Map<number, PlManMatch>()),
}));
vi.mock("./matchDetail", () => ({ matchManEvents: reads.matchManEvents }));
vi.mock("./benchOrders", () => ({ benchOrder: reads.benchOrder }));
vi.mock("./poolNews", async (original) => ({ ...(await original<typeof import("./poolNews")>()), readPoolNews: reads.readPoolNews }));
vi.mock("./scoreboard", () => ({
  squadLivePoints: reads.squadLivePoints,
  liveScores: async () => ({ scores: new Map(), subs: new Map(), refused: null, fetchedAt: null }),
}));
vi.mock("./squads", () => ({
  teamDisplay: () => (reads.locked ? { show: "lineup", period: 8 } : { show: "squad", because: "not-locked", period: 8 }),
}));
vi.mock("./clock", () => ({ now: () => new Date("2026-10-26T22:00:00Z") }));

const fixture = (id: number, status: Fixture["status"]): Fixture => ({
  id, code: id, gameweek: 8, homeClubId: 1, awayClubId: 2, kickoff: "2026-10-24T14:00:00Z", homeScore: null,
  awayScore: null, status, settled: status === "finished", minutes: status === "upcoming" ? 0 : 90,
  homeDifficulty: null, awayDifficulty: null,
});
const snapshot = (...statuses: Fixture["status"][]): FootballSnapshot => ({
  clubs: [], players: [], stats: [], gameweek: 8, deadline: null, gameweeks: [8], fetchedAt: "2026-10-26T22:00:00Z",
  dataChecked: true, statsUnavailable: false, fixtures: statuses.map((status, i) => fixture(i + 1, status)),
});
const man = (fantraxId: string, status: string, fitness: Partial<FootballPlayer>) => ({
  slot: { fantraxId, position: "M", status },
  player: { code: 1, clubId: null, name: fantraxId, newsAdded: null, status: "a", news: "", chanceOfPlaying: null, ...fitness } as FootballPlayer,
  stats: [],
});
const team: RosteredTeam = {
  teamId: "t",
  teamName: "T",
  players: [man("mainoo", "ACTIVE", { status: "d", news: "Knock - 75% chance of playing", chanceOfPlaying: 75 }), man("elanga", "RESERVE", {})],
};
const squads = (...statuses: Fixture["status"][]) =>
  ({ snapshot: snapshot(...statuses), roundPeriod: 8, info: { scoringCategories: {} } }) as unknown as ReadableSquads;

beforeEach(() => {
  reads.locked = true;
  reads.benchOrder.mockClear();
  reads.readPoolNews.mockClear();
});

describe("teamSheet", () => {
  it("draws a finished week with its points and no doubt or story against a man who played", async () => {
    const { stage, sheet, news, live } = await teamSheet(squads("finished", "finished"), team);
    expect(stage).toBe("finished");
    const mainoo = sheet.rows[0].players[0];
    expect(mainoo.points).toBe(0);
    expect("player" in mainoo.rostered && mainoo.rostered.player).toMatchObject({ status: "", news: "", chanceOfPlaying: null });
    expect(news).toEqual({});
    expect(live?.played).toEqual({ mainoo: 90 });
  });

  it("keeps today's news while the week is being played", async () => {
    const { news } = await teamSheet(squads("finished", "live"), team);
    expect(Object.keys(news)).toEqual(["mainoo"]);
  });

  it("reads the bench as locked once the lock has passed, though no ball is kicked", async () => {
    await teamSheet(squads("upcoming"), team);
    expect(reads.benchOrder).toHaveBeenLastCalledWith("t", 8, true);
    reads.locked = false;
    await teamSheet(squads("upcoming"), team);
    expect(reads.benchOrder).toHaveBeenLastCalledWith("t", 8, false);
  });

  it("prints no figure before the first ball, and reads none of the week's", async () => {
    const { stage, sheet, live } = await teamSheet(squads("upcoming"), team);
    expect(stage).toBe("unscored");
    expect(sheet.rows[0].players[0].points).toBeUndefined();
    expect(live).toBeNull();
  });

  // #192: only the head-to-head built these, in its page, so the Team tab's pitch drew no ▼65' or ▲66'.
  it("carries who went off and who came on in his real match, the bench included", async () => {
    const did = (onAt: number | null, offAt: number | null) => ({ onAt, offAt }) as PlManMatch;
    reads.matchManEvents.mockResolvedValueOnce(new Map([[1, did(null, 65)], [2, did(52, null)]]));
    const clubs = [1, 2].map((id) => ({ id, code: id, name: `C${id}`, shortName: `C${id}` }));
    const at = (fantraxId: string, status: string, code: number) => man(fantraxId, status, { code, clubId: 1 });
    const read = { ...squads("finished"), snapshot: { ...snapshot("finished"), clubs } } as ReadableSquads;
    const { subs } = await teamSheet(read, { ...team, players: [at("mainoo", "ACTIVE", 1), at("elanga", "RESERVE", 2)] });
    expect(subs).toEqual({ mainoo: { minute: 65, off: true }, elanga: { minute: 52, off: false } });
  });
});
