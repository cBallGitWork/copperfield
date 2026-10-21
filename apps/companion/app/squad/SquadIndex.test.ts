import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const TABLE = [{ teamId: "t2", rank: 1 }, { teamId: "t1", rank: 2 }, { teamId: "t3", rank: 3 }, { teamId: "t4", rank: 3 }];
const state = vi.hoisted(() => ({
  holder: true,
  mine: "t1" as string | null,
  cap: 14 as number | null,
  table: [] as { teamId: string; rank: number }[] | { unavailable: string },
}));
const team = (teamId: string, teamName: string, size: number) => ({
  teamId,
  teamName,
  players: Array.from({ length: size }, (_, at) => ({ fantraxId: `${teamId}-${at}`, player: {} })),
});
vi.mock("../squads", () => ({
  getLeagueSquads: async () => ({
    period: { period: 8, teams: [team("t1", "Raccoons", 14), team("t2", "Glengarry", 14), team("t3", "Short FC", 13), team("t4", "Over FC", 15)] },
    roundPeriod: 8,
    info: {
      roster: { maxTotalPlayers: state.cap },
      teams: [{ teamId: "t1", name: "Raccoons" }, { teamId: "t2", name: "Glengarry" }, { teamId: "t3", name: "Short FC" }, { teamId: "t4", name: "Over FC" }],
      matchups: [{ period: 8, homeTeamId: "t1", awayTeamId: "t2" }, { period: 8, homeTeamId: "t3", awayTeamId: "t4" }],
    },
  }),
}));
vi.mock("../round", () => ({ planningRound: async () => 8 }));
vi.mock("../session", () => ({ myTeamId: async () => state.mine, signedIn: async () => state.holder }));
vi.mock("./SignIn", () => ({ default: () => createElement("form", { id: "sign-in" }) }));
vi.mock("./actions", () => ({ forgetTeam: "/forget" }));
vi.mock("../teamNames", () => ({ shortName: (_: string, name: string) => name }));
vi.mock("../standings", () => ({ leagueTable: async () => state.table }));
vi.mock("@/app/desk", () => import("../desk"));
vi.mock("@/app/components/shell/Link", () => ({ default: (props: object) => createElement("a", props) }));
vi.mock("next/navigation", () => ({ useRouter: () => ({}) }));

import SquadIndex from "./SquadIndex";

const html = async () => renderToStaticMarkup(await SquadIndex({ back: "/more" }));
const row = (page: string, name: string) => page.slice(page.lastIndexOf("<a", page.indexOf(`>${name}<`)), page.indexOf("</a>", page.indexOf(`>${name}<`)));

/** The row's first tag inside its link: the index block. */
const block = (page: string, name: string) => {
  const at = row(page, name);
  const open = at.indexOf("<span", at.indexOf(">"));
  return at.slice(open, at.indexOf("</span>", open));
};
const list = (page: string) => page.slice(page.indexOf("<ul"), page.indexOf(">", page.indexOf("<ul")));

beforeEach(() => Object.assign(state, { holder: true, mine: "t1", cap: 14, table: TABLE }));

// M-SHELL-8 + M-SQUADS-9: every row ended in the same unlabelled '14'.
describe("a squad's size on the index", () => {
  it("prints nothing for a full squad", async () => {
    expect(row(await html(), "Glengarry")).not.toMatch(/>\s*14\s*</);
  });

  it("prints a labelled size for a squad short of, or over, the league's limit", async () => {
    const page = await html();
    expect(row(page, "Short FC")).toContain(">13/14<");
    expect(row(page, "Over FC")).toContain(">15/14<");
  });

  it("prints none when the league names no limit", async () => {
    state.cap = null;
    expect(row(await html(), "Short FC")).not.toMatch(/>\d+(\/\d+)?</);
  });
});

// M-SHELL-8 + M-SQUADS-9: the sign-out sat between his team and a plate heading the rest.
describe("the index's order", () => {
  it("puts his row first in the one list, with the sign-out under it on a surface, and no plate", async () => {
    const page = await html();
    expect(page).not.toContain("Around the league");
    expect(page.indexOf(">Raccoons<")).toBeLessThan(page.indexOf(">Glengarry<"));
    expect(page.indexOf("<ul")).toBeLessThan(page.indexOf(">Raccoons<"));
    const signOut = page.indexOf("Not you? Sign out");
    expect(signOut).toBeGreaterThan(page.indexOf("</ul>"));
    expect(page.slice(page.lastIndexOf("<form", signOut), signOut)).toMatch(/cm-panel[\s\S]*min-h-11/);
  });

  it("gives every row's index block the same 4px left edge, so his name starts in the column with the rest", async () => {
    const page = await html();
    expect(block(page, "Raccoons")).toContain("border-l-4 border-l-accent");
    for (const name of ["Glengarry", "Short FC", "Over FC"]) expect(block(page, name)).toContain("border-l-4 border-l-transparent");
  });

  it("keeps the sign-in at the head for a reader with no code", async () => {
    Object.assign(state, { holder: false, mine: null });
    const page = await html();
    expect(page.indexOf('id="sign-in"')).toBeLessThan(page.indexOf("<ul"));
    expect(page).not.toContain("Sign out");
  });
});

// M-CONSIST-13: the opponent printed 'V Glengarry' where every other screen prints a lowercase 'v'.
describe("the opponent", () => {
  it("prints as a plain lowercase 'v'", async () => {
    const page = await html();
    expect(page).toContain(">v Glengarry<");
    expect(page).not.toContain('uppercase">v<');
  });
});

// D-20: every other team list (waivers, the picker, standings) leads with the place; the squad index had none.
describe("each row's index block", () => {
  it("leads the row with the team's table place, ties marked, in CM's index block", async () => {
    const page = await html();
    expect(block(page, "Glengarry")).toContain("cm-index");
    expect(block(page, "Glengarry")).toMatch(/>1st$/);
    expect(block(page, "Raccoons")).toMatch(/>2nd$/);
    expect(block(page, "Short FC")).toMatch(/>=3rd$/);
  });

  it("stays on the index blue at the table's width, as every place column does", async () => {
    const page = await html();
    expect(block(page, "Glengarry")).not.toContain("--cm-index");
    expect(list(page)).not.toContain("cm-index-scoped");
    expect(block(page, "Glengarry")).toMatch(/\bw-8 px-0 lg:w-14\b/);
  });

  it("stays, empty, when there is no table, so the names keep their column", async () => {
    state.table = { unavailable: "down" };
    const page = await html();
    expect(block(page, "Glengarry")).toContain("cm-index");
    expect(block(page, "Glengarry")).toMatch(/>$/);
  });

  it("sits flush in one panel, so the spine meets its edge", async () => {
    const page = await html();
    expect(list(page)).toContain("cm-panel");
    expect(list(page)).not.toMatch(/\bp-2\b/);
    expect(row(page, "Glengarry").slice(0, row(page, "Glengarry").indexOf(">"))).not.toMatch(/\bpx-3\b/);
  });
});
