import { createElement, isValidElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Every read the Live page can make, as a spy, and what the next render is told.
const r = vi.hoisted(() => {
  const at = new Date("2026-10-24T13:00:00Z");
  const fixtures = [
    { id: 1, code: 11, gameweek: 8, kickoff: "2026-10-24T14:00:00Z", status: "upcoming" },
    { id: 2, code: 12, gameweek: 8, kickoff: "2026-10-25T15:30:00Z", status: "upcoming" },
  ];
  const snapshot = { gameweek: 8, fixtures, players: [], clubs: [] };
  const info = { rosterPeriods: [], matchups: [], teams: [{ teamId: "a", name: "A" }, { teamId: "b", name: "B" }] };
  const squads = { period: { teams: [] }, roundPeriod: 8, info };
  return {
    at,
    snapshot,
    squads,
    during: true,
    state: null as string | null,
    fn: {
      getLeagueSquads: vi.fn(async () => ({ ok: squads })),
      readerTeamId: vi.fn(async () => "a"),
      marks: vi.fn(async () => ({ owners: new Map() })),
      marksFor: vi.fn(async () => ({ owners: new Map([[7, { teamId: "a" }]]) })),
      liveScores: vi.fn(async () => ({ scores: new Map([["a", { teamId: "a", points: 12 }]]), subs: new Map(), refused: null, fetchedAt: null })),
      leagueTable: vi.fn(async () => []),
      roundStreams: vi.fn(async () => []),
      roundGoals: vi.fn(async () => []),
      roundAssistKinds: vi.fn(async () => new Map()),
      roundCodes: vi.fn(async () => new Map()),
      roundFigures: vi.fn(async () => [{ code: 1 }]),
      withRoundState: vi.fn(async (f: readonly unknown[]) => [...f]),
      gameweekBoards: vi.fn(async () => ({ boards: [{ key: "pts" }], teamNames: new Map([["a", "A"]]) })),
      lockAhead: vi.fn(async () => "2026-10-30T17:30:00Z"),
    },
  };
});

// A stand-in draws its name and the props it was given, so two renders compare byte for byte.
const props = (value: unknown) =>
  JSON.stringify(value, (_, v) => (v instanceof Map ? [...v] : isValidElement(v) ? renderToStaticMarkup(v) : v));
function stub(name: string) {
  return function Stub(p: object) {
    return createElement(`x-${name}`, { "data-p": props(p) });
  };
}

vi.mock("@epl/core", async (actual) => ({
  ...(await actual<object>()),
  roundState: () => r.state,
  nextRound: () => (r.during ? null : { gameweek: 9, kickoff: "2026-10-31T15:00:00Z" }),
  nextDeadline: () => ({ locksAt: "2026-10-24T13:30:00Z" }),
  leagueTies: () => [{ tie: "league" }],
  cupTies: () => [],
  periodPairings: () => [],
}));
vi.mock("../football", () => ({
  footballNow: async () => r.snapshot,
  seasonFixtures: async () => [],
  liveOpen: () => r.during,
  roundFigures: r.fn.roundFigures,
  speaksForNow: () => true,
  takenLately: () => true,
}));
vi.mock("../squads", () => ({
  getLeagueSquads: r.fn.getLeagueSquads,
  readable: (s: { ok?: unknown }) => s.ok ?? null,
  readerTeamId: r.fn.readerTeamId,
}));
vi.mock("../involvement", () => ({ marks: r.fn.marks, marksFor: r.fn.marksFor }));
vi.mock("../scoreboard", () => ({ liveScores: r.fn.liveScores }));
vi.mock("../standings", () => ({ leagueTable: r.fn.leagueTable }));
vi.mock("../commentary", () => ({
  creditAssists: () => [],
  roundGoals: r.fn.roundGoals,
  roundStreams: r.fn.roundStreams,
  withRoundState: r.fn.withRoundState,
}));
vi.mock("../assistKinds", () => ({ roundAssistKinds: r.fn.roundAssistKinds }));
vi.mock("./sheetCodes", () => ({ roundCodes: r.fn.roundCodes }));
vi.mock("./boards", () => ({ gameweekBoards: r.fn.gameweekBoards }));
vi.mock("../lockAhead", () => ({ lockAhead: r.fn.lockAhead }));
vi.mock("../clock", () => ({ now: () => r.at }));
vi.mock("../prem/places", () => ({ clubPlaces: () => new Map([[1, 3]]) }));
vi.mock("./TopStats", () => ({ default: stub("topstats"), STATS_VIEW: "stats", TOP_STATS: "Top stats", statsHref: () => "/matchday?view=stats" }));
vi.mock("./Scores", () => ({ Scores: stub("scores") }));
vi.mock("./Between", () => ({ BetweenGameweeks: stub("between") }));
vi.mock("./ShareButton", () => ({ default: stub("share") }));
vi.mock("../components/league/RoundWord", () => ({ default: stub("roundword") }));
vi.mock("../components/shell/PageHeader", () => ({ default: stub("header") }));
vi.mock("../components/shell/TabStrip", () => ({ default: stub("tabs") }));
vi.mock("../components/shell/OutLink", () => ({ default: stub("outlink") }));
vi.mock("@/app/components/shell/Link", () => ({ default: stub("link") }));

const { default: MatchdayPage } = await import("./page");

// Runs every component in the tree, async ones included, down to the stand-ins and plain tags.
async function settle(node: ReactNode): Promise<ReactNode> {
  if (Array.isArray(node)) return Promise.all(node.map(settle));
  if (!isValidElement<{ children?: ReactNode }>(node)) return node;
  if (typeof node.type === "function") return settle(await (node.type as (p: object) => ReactNode)(node.props));
  const { children, ...rest } = node.props;
  return createElement(node.type, rest, await settle(children));
}

const render = async (query: { view?: string; day?: string } = {}) =>
  renderToStaticMarkup(await settle(await MatchdayPage({ searchParams: Promise.resolve(query) })));

const scoresOnly = [
  r.fn.roundStreams,
  r.fn.roundGoals,
  r.fn.roundAssistKinds,
  r.fn.roundCodes,
  r.fn.withRoundState,
  r.fn.liveScores,
  r.fn.leagueTable,
];

beforeEach(() => {
  vi.clearAllMocks();
  r.during = true;
  r.state = null;
});

describe("Live's reads", () => {
  it("asks nothing the scores need between gameweeks", async () => {
    r.during = false;
    r.state = "final";
    const html = await render();
    expect(html).toContain("x-between");
    for (const read of scoresOnly) expect(read).not.toHaveBeenCalled();
  });

  it("asks nothing the scores need on the top stats", async () => {
    const html = await render({ view: "stats" });
    expect(html).toContain("x-topstats");
    expect(r.fn.gameweekBoards).toHaveBeenCalledOnce();
    for (const read of scoresOnly) expect(read).not.toHaveBeenCalled();
  });

  it("reads the league's squads once for the scores, and marks them off that one read", async () => {
    const html = await render();
    expect(html).toContain("x-scores");
    expect(r.fn.getLeagueSquads).toHaveBeenCalledOnce();
    expect(r.fn.marks).not.toHaveBeenCalled();
    expect(r.fn.marksFor).toHaveBeenCalledWith(r.squads, r.snapshot.fixtures);
    expect(r.fn.gameweekBoards).not.toHaveBeenCalled();
  });

  it("marks nothing when the league cannot be read", async () => {
    r.fn.getLeagueSquads.mockResolvedValueOnce({} as never);
    expect(await render()).toContain("x-scores");
    expect(r.fn.marksFor).not.toHaveBeenCalled();
  });
});
