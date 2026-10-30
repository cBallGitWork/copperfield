import { describe, expect, it } from "vitest";
import { availabilityOf } from "../football/playerState";
import type { Fixture, FootballPlayer, FootballSnapshot } from "../football/types";
import { isResolved, type RosteredTeam } from "./roster";
import { NO_MINUTES, type LineupDetail, type SquadPlayerDetail } from "./squadDetail";
import { sheetStage, teamSheetDetail, withoutFitness } from "./teamSheet";

const man = (fantraxId: string, fitness: Pick<FootballPlayer, "status" | "news" | "chanceOfPlaying">): SquadPlayerDetail => ({
  rostered: { slot: { fantraxId, position: "M", status: "" }, player: { code: 1, name: fantraxId, newsAdded: null, ...fitness } as FootballPlayer, stats: [] },
  club: undefined,
  opposition: [],
  points: 4,
  minutes: [],
});

const stateOf = (player: SquadPlayerDetail) => availabilityOf(isResolved(player.rostered) ? player.rostered.player : null).state;

describe("a played week's sheet", () => {
  // Review N9: Mainoo's plate went gold on GW6, from a doubt dated 12 Oct; he played 90 and took 4.
  it("draws nobody doubtful or injured from today's news", () => {
    const sheet: LineupDetail = {
      rows: [{ position: "M", players: [man("mainoo", { status: "d", news: "Knock - 75% chance of playing", chanceOfPlaying: 75 })] }],
      bench: [man("elanga", { status: "i", news: "Leg injury", chanceOfPlaying: 0 })],
      shape: "0-0-1-0",
    };
    const played = withoutFitness(sheet);
    expect([...played.rows[0].players, ...played.bench].map(stateOf)).toEqual(["fit", "fit"]);
  });

  it("keeps everything else about the sheet", () => {
    const sheet: LineupDetail = { rows: [{ position: "M", players: [man("a", { status: "a", news: "", chanceOfPlaying: null })] }], bench: [], shape: "0-0-1-0" };
    const played = withoutFitness(sheet);
    expect(played.shape).toBe("0-0-1-0");
    expect(played.rows[0].players[0].points).toBe(4);
    expect(played.rows[0].players[0].rostered.slot.fantraxId).toBe("a");
  });
});

const fixture = (status: Fixture["status"]): Fixture => ({
  // An unplayed match kicks off after `AFTER`: one long past its kickoff reads as postponed.
  id: 1, code: 1, gameweek: 8, homeClubId: 1, awayClubId: 2, homeScore: null,
  kickoff: status === "upcoming" ? "2026-10-27T20:00:00Z" : "2026-10-24T14:00:00Z",
  awayScore: null, status, settled: status === "finished", minutes: status === "upcoming" ? 0 : 90,
  homeDifficulty: null, awayDifficulty: null,
});
const week = (...statuses: Fixture["status"][]): FootballSnapshot => ({
  clubs: [], players: [], stats: [], gameweek: 8, deadline: null, gameweeks: [8], fetchedAt: "2026-10-26T22:00:00Z",
  dataChecked: true, statsUnavailable: false, fixtures: statuses.map((status, i) => ({ ...fixture(status), id: i + 1 })),
});
const AFTER = "2026-10-26T22:00:00Z";

describe("sheetStage", () => {
  it("is unscored before a ball is kicked, live while one is, finished after the last whistle", () => {
    expect(sheetStage(week("upcoming", "upcoming"), AFTER)).toBe("unscored");
    expect(sheetStage(week("finished", "live"), AFTER)).toBe("live");
    // Between two kickoffs: no match in play, but the week is not over.
    expect(sheetStage(week("finished", "upcoming"), AFTER)).toBe("live");
    expect(sheetStage(week("finished", "finished"), AFTER)).toBe("finished");
  });
});

describe("teamSheetDetail", () => {
  // #184: GW8 on the Team tab drew 21 doubts and 30 stories the head-to-head did not, against men who had played.
  const slot = (fantraxId: string, status: string, fitness: Pick<FootballPlayer, "status" | "news" | "chanceOfPlaying">) => ({
    slot: { fantraxId, position: "M", status },
    player: { code: 1, clubId: null, name: fantraxId, newsAdded: null, ...fitness } as unknown as FootballPlayer,
    stats: [],
  });
  const team: RosteredTeam = {
    teamId: "t",
    teamName: "T",
    players: [
      slot("mainoo", "ACTIVE", { status: "d", news: "Knock - 75% chance of playing", chanceOfPlaying: 75 }),
      slot("elanga", "RESERVE", { status: "a", news: "", chanceOfPlaying: null }),
      slot("minteh", "RESERVE", { status: "a", news: "", chanceOfPlaying: null }),
    ],
  };
  const scored = new Map<string, number | null>([["mainoo", 0], ["elanga", 2], ["minteh", null]]);
  const draw = (stage: Parameters<typeof teamSheetDetail>[1]) =>
    teamSheetDetail(team, stage, new Map(), new Map(), scored, NO_MINUTES, ["minteh", "elanga"]);
  const everyone = (sheet: LineupDetail) => [...sheet.rows.flatMap((line) => line.players), ...sheet.bench];

  it("draws a finished week with its points, noughts included, and nobody doubtful", () => {
    const sheet = draw("finished");
    expect(everyone(sheet).map((man) => [man.rostered.slot.fantraxId, man.points, stateOf(man)])).toEqual([
      ["mainoo", 0, "fit"],
      ["minteh", null, "fit"],
      ["elanga", 2, "fit"],
    ]);
  });

  it("keeps today's fitness while the week is being played", () => {
    expect(stateOf(draw("live").rows[0].players[0])).not.toBe("fit");
  });

  it("prints no figure before the first ball, whatever Fantrax answers", () => {
    expect(draw("unscored").rows[0].players[0].points).toBeUndefined();
  });
});
