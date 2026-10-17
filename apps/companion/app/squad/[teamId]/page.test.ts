import { describe, expect, it, vi } from "vitest";

const reads = vi.hoisted(() => ({ readerTeamId: vi.fn(), squadView: vi.fn() }));
vi.mock("../../squads", () => ({ readerTeamId: reads.readerTeamId }));
vi.mock("./squadView", () => ({ squadView: reads.squadView }));
vi.mock("../SquadIndex", () => ({ default: function SquadIndex() {} }));
// What the page draws for a team, which this case never reaches.
vi.mock("../../components/league/LineupPlanner", () => ({ default: () => null }));
vi.mock("../../components/league/SquadBoard", () => ({ default: () => null }));
vi.mock("../../components/shell/QuerySelect", () => ({ default: () => null }));
vi.mock("./Sheet", () => ({ default: () => null }));
vi.mock("./Shell", () => ({ default: () => null }));
vi.mock("./saving", () => ({ commissionerSession: () => null }));
vi.mock("./title", () => ({ teamTitle: () => async () => ({}) }));

import TeamPage from "./page";
import SquadIndex from "../SquadIndex";

/** The page's props for a slug, with no `?gw=`. */
const props = (teamId: string) => ({ params: Promise.resolve({ teamId }), searchParams: Promise.resolve({}) });

// M9: signed out, Team led to /squad and lit Draft. The front door now draws the sign-in itself.
describe("the front door with no team", () => {
  it("draws the squads and the sign-in at /squad/me, so the Team tab stays lit", async () => {
    reads.readerTeamId.mockResolvedValue(null);
    const page = (await TeamPage(props("me"))) as { type: unknown };
    expect(page.type).toBe(SquadIndex);
    expect(reads.squadView).not.toHaveBeenCalled();
  });
});
