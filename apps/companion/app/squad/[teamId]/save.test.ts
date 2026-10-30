import { beforeEach, describe, expect, it, vi } from "vitest";

// The save's lock gate: a period's first kickoff less the lock lead, less the save margin. A save that passes the gate
// stops at sign-in, so no Fantrax write is reached.
const r = vi.hoisted(() => {
  const P8 = { number: 8, start: "2026-10-23T06:00:00.0-0400", end: "2026-10-30T05:59:59.0-0400" };
  const kickoffs = [
    { gameweek: 8, kickoff: "2026-10-24T14:00:00Z" },
    { gameweek: 8, kickoff: "2026-10-24T11:30:00Z" },
    { gameweek: 7, kickoff: "2026-10-20T19:00:00Z" },
  ];
  return { now: new Date(0), squads: { period: { teams: [] }, info: { rosterPeriods: [P8], players: [], roster: {} }, kickoffs } };
});

vi.mock("../../clock", () => ({ now: () => r.now, replayAt: () => null }));
vi.mock("../../round", () => ({ planningRound: async () => ({ period: 8, gameweek: 8 }) }));
vi.mock("../../squads", () => ({ SQUADS_KEY: "squads", getLeagueSquads: async () => r.squads }));
vi.mock("../../session", () => ({ signedTeamId: async () => null }));
vi.mock("../../leagueCache", () => ({ markStale: () => {} }));
vi.mock("../../benchOrders", () => ({ OPEN_ORDER_KEY: "bench" }));
vi.mock("../../rosterMinimums", () => ({ rosterMinimums: () => ({}) }));
vi.mock("./saving", () => ({ commissionerSession: () => null }));

import { saveLineup } from "./save";

const plan = { period: 8, slots: [], bench: [], reordered: false, held: { slots: [], bench: [] } };
// 11:30Z first ball, 15 minutes' lead, 10 minutes' margin: the last instant a save may be sent is just before 11:05Z.
const GATE = Date.parse("2026-10-24T11:05:00.000Z");

describe("saveLineup's lock gate", () => {
  beforeEach(() => {
    r.now = new Date(0);
  });

  it("lets a save through until the margin before the period's first kickoff's lock", async () => {
    r.now = new Date(GATE - 1);
    expect(await saveLineup(plan)).toEqual({ ok: false, messages: ["Sign in with your team code to save."] });
  });

  it("refuses from that instant on", async () => {
    r.now = new Date(GATE);
    expect(await saveLineup(plan)).toEqual({ ok: false, messages: ["Gameweek 8 is about to lock. Set this line-up in Fantrax instead."] });
  });
});
