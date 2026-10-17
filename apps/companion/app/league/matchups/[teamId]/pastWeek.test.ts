import { describe, expect, it } from "vitest";
import type { FootballPlayer, LineupDetail, SquadPlayerDetail } from "@epl/core";
import { availabilityOf, isResolved } from "@epl/core";
import { withoutFitness } from "./pastWeek";

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
