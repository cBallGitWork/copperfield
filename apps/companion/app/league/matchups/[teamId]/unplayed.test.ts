import { describe, expect, it } from "vitest";
import type { FootballPlayer, LeagueTeam, RosteredPlayer, RosteredTeam } from "@epl/core";
import { unplayedLists } from "./unplayed";

const man = (fantraxId: string, position: string, status: "ACTIVE" | "RESERVE"): RosteredPlayer => ({
  slot: { fantraxId, position, status },
  player: { code: 1, name: fantraxId, clubId: 1 } as FootballPlayer,
  stats: [],
});

// Zed starts and Abe sits: alphabetical order would put the reserve first, which is what a rival's list must do.
const roster = (teamId: string): RosteredTeam => ({
  teamId,
  teamName: teamId,
  players: [man("zed", "M", "ACTIVE"), man("abe", "M", "RESERVE"), man("keeper", "G", "ACTIVE")],
});

const team = (teamId: string) => ({ teamId, name: teamId }) as LeagueTeam;

const lists = unplayedLists({
  pairing: { team: team("mine"), opponent: team("rival") },
  rostered: new Map([["mine", roster("mine")], ["rival", roster("rival")]]),
  shows: (side) => side.teamId === "mine",
  benches: new Map(),
  clubs: new Map(),
  opposition: new Map(),
});

describe("a tie before a ball is kicked", () => {
  // Review N6: your own preview was a 14-man list with no eleven and no bench.
  it("draws your own side as its eleven, then its bench", () => {
    const mine = lists.get("mine");
    if (mine === undefined || !("sheet" in mine)) throw new Error("expected your eleven");
    expect(mine.sheet.rows.flatMap((line) => line.players.map((p) => p.rostered.slot.fantraxId))).toEqual(["keeper", "zed"]);
    expect(mine.sheet.bench.map((p) => p.rostered.slot.fantraxId)).toEqual(["abe"]);
  });

  it("never draws a rival's eleven before his lock: his squad, alphabetical within a line", () => {
    const rival = lists.get("rival");
    if (rival === undefined || !("lines" in rival)) throw new Error("expected his squad");
    expect(rival.lines.map((line) => line.players.map((p) => p.rostered.slot.fantraxId))).toEqual([["keeper"], ["abe", "zed"]]);
  });
});
