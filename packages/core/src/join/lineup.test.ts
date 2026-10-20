import { describe, expect, it } from "vitest";
import { NO_SEASON } from "../football/noSeason";
import type { FootballPlayer } from "../football/types";
import type { RosteredPlayer, RosteredTeam } from "./roster";
import { everyLine, lineup, squadUnarranged } from "./lineup";
import { mapBenchOrder, type RawTeamRosterInfo } from "../league/fantrax/benchOrder";
import raccoons from "../league/fantrax/__fixtures__/teamRosterInfoBench.json";

const player = (name: string): FootballPlayer => ({
  id: 1, code: 1, name, fullName: name, clubId: 1,
  status: "a", news: "", chanceOfPlaying: null, optaCode: null, birthDate: null, region: null, newsAdded: null, season: NO_SEASON,
});

const slot = (position: string | null, status: string, name = "X"): RosteredPlayer => ({
  slot: { fantraxId: name, position, status },
  player: player(name),
  stats: [],
});

const team = (players: RosteredPlayer[]): RosteredTeam => ({
  teamId: "t1",
  teamName: "CB_fantr",
  players,
});

/** The rehearsal league's real drafted XI: one keeper, three at the back, four
 *  in midfield, three up front, four on the bench. */
const drafted = team([
  slot("F", "RESERVE", "Maeda"),
  slot("M", "ACTIVE", "Palmer"),
  slot("M", "RESERVE", "Doku"),
  slot("G", "ACTIVE", "Martinez"),
  slot("F", "ACTIVE", "Haaland"),
  slot("M", "ACTIVE", "Bruno G."),
  slot("M", "RESERVE", "Rudoni"),
  slot("F", "ACTIVE", "João Pedro"),
  slot("D", "ACTIVE", "Cash"),
  slot("D", "ACTIVE", "Truffert"),
  slot("D", "ACTIVE", "Mukiele"),
  slot("M", "ACTIVE", "Wilson"),
  slot("F", "ACTIVE", "Isak"),
  slot("M", "ACTIVE", "Enzo"),
  slot("M", "RESERVE", "Manzambi"),
]);

describe("lineup", () => {
  it("orders the lines back to front, whatever order Fantrax listed them in", () => {
    // The fixture above is in Fantrax's own order, which is neither positional
    // nor alphabetical — it is draft order.
    expect(lineup(drafted).lines.map((line) => line.position)).toEqual(["G", "D", "M", "F"]);
  });

  it("counts the formation rather than reading one, because Fantrax has no such field", () => {
    expect(lineup(drafted).shape).toBe("1-3-4-3");
  });

  it("keeps the eleven on the pitch and the rest on the bench", () => {
    const { lines, bench } = lineup(drafted);
    expect(lines.flatMap((line) => line.players)).toHaveLength(11);
    expect(bench).toHaveLength(4);
  });

  it("puts the bench in the same order as the pitch", () => {
    expect(lineup(drafted).bench.map((p) => p.slot.fantraxId)).toEqual([
      "Doku", "Rudoni", "Manzambi", "Maeda",
    ]);
  });

  it("puts the bench in Fantrax's order for the period when it is given one", () => {
    // The Raccoons' gameweek 6, read off getTeamRosterInfo: Kudus 1, Kerkez 2, Hinshelwood 3. By position Kerkez
    // (the defender) would stand first, and by points (15, 13, 10) Kerkez then Hinshelwood.
    const order = mapBenchOrder(raccoons as RawTeamRosterInfo).order;
    const squad = team([
      slot("D", "RESERVE", "06do9"),
      slot("M", "RESERVE", "067ys"),
      slot("M", "RESERVE", "06fv8"),
      slot("G", "ACTIVE", "G1"),
    ]);
    expect(lineup(squad).bench.map((p) => p.slot.fantraxId)).toEqual(["06do9", "067ys", "06fv8"]);
    expect(lineup(squad, order).bench.map((p) => p.slot.fantraxId)).toEqual(["06fv8", "06do9", "067ys"]);
  });

  it("puts a reserve the order does not name after the ones it does, in position order", () => {
    const squad = team([slot("F", "RESERVE", "F9"), slot("M", "RESERVE", "M9"), slot("D", "RESERVE", "D9")]);
    expect(lineup(squad, ["F9", "gone"]).bench.map((p) => p.slot.fantraxId)).toEqual(["F9", "D9", "M9"]);
  });

  it("survives a shape nobody would pick", () => {
    // A commissioner can set any caps, and a manager who has not set a lineup can
    // leave one on. Five at the back with no forwards is legal in our league.
    const odd = team([
      slot("G", "ACTIVE", "G1"),
      ...["D1", "D2", "D3", "D4", "D5"].map((n) => slot("D", "ACTIVE", n)),
    ]);
    expect(lineup(odd).shape).toBe("1-5");
  });

  it("shows a letter it has never seen in front of every one it knows", () => {
    // A new letter goes to the front, where it looks wrong on purpose. It is listed FIRST with a line between the
    // known two, or a sort that filed it in goal would pass on insertion order alone.
    const withWinger = team([
      slot("W", "ACTIVE", "W1"),
      slot("G", "ACTIVE", "G1"),
      slot("D", "ACTIVE", "D1"),
    ]);
    expect(lineup(withWinger).lines.map((line) => line.position)).toEqual(["G", "D", "W"]);
  });

  it("places a slot Fantrax gave no position rather than dropping the player", () => {
    const nameless = team([
      slot(null, "ACTIVE", "?"),
      slot("G", "ACTIVE", "G1"),
      slot("D", "ACTIVE", "D1"),
    ]);
    const { lines } = lineup(nameless);
    expect(lines.flatMap((line) => line.players)).toHaveLength(3);
    expect(lines.map((line) => line.position)).toEqual(["G", "D", ""]);
  });

  it("degrades to an empty pitch rather than throwing", () => {
    // What every team returns before the draft.
    expect(lineup(team([]))).toEqual({ lines: [], bench: [], shape: "" });
  });
});

describe("squadUnarranged", () => {
  it("keeps all fifteen, in the same lines the pitch would use", () => {
    const lines = squadUnarranged(drafted);
    expect(lines.map((line) => line.position)).toEqual(["G", "D", "M", "F"]);
    expect(lines.flatMap((line) => line.players)).toHaveLength(15);
  });

  it("orders by name, so no reader can recover the XI from the order", () => {
    // Two reserves and five actives in one line. Alphabetical puts a reserve
    // first, which is the whole point: the order says nothing about who starts.
    const midfield = squadUnarranged(drafted).find((line) => line.position === "M");
    expect(midfield?.players.map((player) => player.slot.fantraxId)).toEqual([
      "Bruno G.",
      "Doku",
      "Enzo",
      "Manzambi",
      "Palmer",
      "Rudoni",
      "Wilson",
    ]);
  });

  it("groups by the position the manager has him filling, not by what he could fill", () => {
    // Fantrax deems this player F,M eligible; his slot says M. The manager chose,
    // so he stands in midfield and appears exactly once.
    const dual = team([slot("M", "ACTIVE", "Semenyo"), slot("F", "ACTIVE", "Isak")]);
    const lines = squadUnarranged(dual);
    expect(lines.map((line) => line.position)).toEqual(["M", "F"]);
    expect(lines.flatMap((line) => line.players)).toHaveLength(2);
  });
});

describe("everyLine", () => {
  // 19 Oct 2026: an eleven with no keeper drew three lines spread over the whole pitch, off its markings.
  it("holds an empty place for a line nobody fills, in pitch order", () => {
    const lines = [{ position: "D", players: ["a"] }, { position: "F", players: ["b"] }];
    expect(everyLine(lines)).toEqual([
      { position: "G", players: [] },
      { position: "D", players: ["a"] },
      { position: "M", players: [] },
      { position: "F", players: ["b"] },
    ]);
  });

  it("keeps a letter it does not know, at the front", () => {
    const lines = [{ position: "G", players: ["k"] }, { position: "D", players: [] }, { position: "M", players: [] }, { position: "F", players: [] }, { position: "", players: ["u"] }];
    expect(everyLine(lines).map((line) => line.position)).toEqual(["G", "D", "M", "F", ""]);
  });
});
