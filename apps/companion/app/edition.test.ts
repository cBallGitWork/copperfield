import { beforeEach, describe, expect, it, vi } from "vitest";
import { edition } from "./edition";

const readBoard = vi.fn(async () => ({ pairings: [], scores: new Map() }));
let statuses: string[] = [];

vi.mock("./clock", () => ({ now: () => new Date("2026-10-11T14:00:00Z") }));
vi.mock("./board", () => ({ readBoard: () => readBoard() }));
vi.mock("./business", () => ({ readDeals: async () => ({ rows: [] }) }));
vi.mock("./scoreboard", () => ({ periodPoints: async () => new Map() }));
vi.mock("./football", () => ({ seasonKickoffs: async () => [] }));
// A Prem Report filed before its picture was stored, as GW6's Saturday one was.
vi.mock("./paper", () => ({
  filed: [{
    slug: "gw6-prem-report-2026-10-10", kind: "match-report", leagueId: "l", period: 6, gameweek: 6, filedAt: "2026-10-11T13:06:32.351Z",
    expiresAt: null, edition: "", byline: "", headline: "Rice feeds Bruno winner", deck: "", body: "", subjects: [], image: null, face: null,
    extras: { reports: [{ home: { code: 3, goals: [], lineup: { lines: [[{ name: "Rice" }]] } }, away: { code: 2, goals: [], lineup: null } }] },
  }],
}));
vi.mock("./squads", () => ({
  getLeagueSquads: async () => ({
    kickoffs: [],
    period: { period: 6, teams: [] },
    snapshot: { gameweek: 6, fixtures: statuses.map((status) => ({ kickoff: "2026-10-11T13:00:00Z", status })), players: [{ code: 204480, name: "Rice", fullName: "Declan Rice", clubId: 1 }], clubs: [{ id: 1, code: 3 }] },
    info: null,
    roundPeriod: 6,
  }),
  readable: (squads: object) => ("period" in squads ? squads : null),
}));

beforeEach(() => readBoard.mockClear());

// Craig, 11 Oct 2026: "Just remove the live match data on Gazetta". Live scores live in the Live tab.
describe("the paper's edition", () => {
  it("reads no head-to-head scores while the gameweek is being played, and carries none", async () => {
    statuses = ["finished", "live"];
    const paper = await edition(null);
    expect(readBoard).not.toHaveBeenCalled();
    expect(paper).not.toHaveProperty("board");
    expect(paper).not.toHaveProperty("live");
    expect(paper).not.toHaveProperty("underway");
  });

  it("reads the finished gameweek's scores for the desk's own stories", async () => {
    statuses = ["finished", "finished"];
    await edition(null);
    expect(readBoard).toHaveBeenCalledOnce();
  });

  it("pictures a Prem Report filed with no face by the man its headline names", async () => {
    statuses = ["finished"];
    expect((await edition(null)).filed[0]?.face).toEqual({ code: 204480, name: "Rice", clubId: 1, position: null });
  });
});

