import { describe, expect, it } from "vitest";
import recordedFixture from "../__fixtures__/plFixture.json";
import recordedRound from "../__fixtures__/plRound.json";
import recordedStats from "../__fixtures__/plMatchStats.json";
import recordedStreams from "../__fixtures__/plTextstream.json";
import assistStreams from "../__fixtures__/plTextstreamAssists.json";
import spursVillaStream from "../__fixtures__/plTextstreamSpursVilla.json";
import {
  keyMoments,
  mapRoundGoals,
  plFixtureCode,
  plCommentary,
  plMatchMetrics,
  worthReading,
} from "./map";
import type {
  RawPlFixture,
  RawPlFixturePage,
  RawPlTextstream,
} from "./raw";
import type { RawPlMatchStats } from "./rawStats";

// Liverpool 2-2 Nottingham Forest (GW2): an assisted goal, a penalty, a VAR-cancelled goal and nine changes.
const [PLAYED] = recordedStreams as unknown as RawPlTextstream[];
const DETAIL = recordedFixture as unknown as RawPlFixture;

describe("plFixtureCode", () => {
  it("reads FPL's fixture code off the provider's own id for the match", () => {
    expect(plFixtureCode(DETAIL)).toBe(2_645_211);
  });

  it("answers null for a fixture carrying no altIds, which the LIST does not", () => {
    // The textstream's own header and every row of a fixture list read without `altIds=true` omit it.
    expect(plFixtureCode(PLAYED.fixture)).toBeNull();
  });
});

// Gameweek 2's ten fixtures, recorded WITH `altIds=true`, without which there is no join key.
const ROUND = recordedRound as unknown as RawPlFixturePage;

describe("plCommentary", () => {
  const lines = plCommentary(PLAYED.events.content);

  it("keeps the WHOLE vocabulary: a report wants everything in one match", () => {
    const kinds = new Set(lines.map((line) => line.type));
    expect(kinds.has("attempt saved")).toBe(true);
    expect(kinds.has("corner")).toBe(true);
    expect(kinds.has("goal")).toBe(true);
  });

  it("runs newest first within each half", () => {
    const split = lines.findIndex((line) => line.text.startsWith("Second Half begins"));
    for (const half of [lines.slice(1, split + 1), lines.slice(split + 1)]) {
      const seconds = half.map((line) => line.seconds);
      expect([...seconds].sort((a, b) => b - a)).toEqual(seconds);
    }
  });

  it("puts the second half above the first half's added time, though its clock reads less", () => {
    // Opta's clock restarts at 45:00 for the second half, so 45+4 (2910s) outranks 46' (2700s).
    const at = (text: string) => lines.findIndex((line) => line.text.startsWith(text));
    expect(at("Second Half begins")).toBeGreaterThan(-1);
    expect(at("Second Half begins")).toBeLessThan(at("First Half ends"));
  });

  it("tops the feed with 'Match ends' at the last whistle's minute, not Opta's first-minute stamp", () => {
    expect(lines[0].type).toBe("end 14");
    expect(lines[1].text.startsWith("Second Half ends")).toBe(true);
    expect(lines[0].minute).toBe(lines[1].minute);
    expect(lines[0].seconds).toBe(lines[1].seconds);
  });

  it("leaves a lone 'Match ends' as Opta stamped it", () => {
    const [end] = plCommentary([{ id: 1, type: "end 14", text: "Match ends", time: { label: "1", secs: 0 } }]);
    expect(end.minute).toBe("1");
  });

  it("orders extra time after the second half", () => {
    const at = (label: string, secs: number, id: number) => ({ id, type: "x", text: "t", time: { label, secs } });
    const order = plCommentary([at("90+3", 5580, 1), at("91", 5400, 2), at("105+1", 6360, 3), at("106", 6300, 4)]);
    expect(order.map((line) => line.id)).toEqual([4, 3, 2, 1]);
  });

  it("drops an event it cannot place in the match", () => {
    // An event with no time, or no text, cannot go in a timeline.
    const blind = plCommentary([
      { id: 1, type: "goal", text: "Goal!" },
      { id: 2, type: "goal", text: "", time: { label: "3", secs: 180 } },
      { id: 3, type: "goal", text: "Goal!", time: { label: "5", secs: 300 } },
    ]);
    expect(blind.map((line) => line.id)).toEqual([3]);
  });
});

describe("mapRoundGoals", () => {
  /** Every man in the gameweek's goals, coded as his own id plus a million so a wrong join shows. */
  const roundCodes = new Map(
    ROUND.content.flatMap((f) =>
      (f.goals ?? []).flatMap((g) =>
        [g.personId, g.assistId].flatMap((id) =>
          id === undefined ? [] : [[id, id + 1_000_000] as [number, number]],
        ),
      ),
    ),
  );
  const goals = mapRoundGoals(ROUND.content, roundCodes);

  it("answers every goal in the round from ONE read", () => {
    // The whole reason the live path is one request and not ten.
    expect(ROUND.content).toHaveLength(10);
    expect(goals).toHaveLength(32);
  });

  it("reconciles with every scoreline", () => {
    // Every fixture's goals match its scoreline, own goals and penalties included.
    for (const fixture of ROUND.content) {
      const [home, away] = fixture.teams;
      const scored = (home.score ?? 0) + (away.score ?? 0);
      expect(goals.filter((g) => g.fixtureCode === plFixtureCode(fixture))).toHaveLength(
        scored,
      );
    }
  });

  it("reads the round's own one-letter vocabulary, which is not the commentary's", () => {
    // Counted off the recording: 27 `G`, 3 `O`, 2 `P`.
    const kinds = goals.map((g) => g.kind);
    expect(kinds.filter((k) => k === "goal")).toHaveLength(27);
    expect(kinds.filter((k) => k === "own-goal")).toHaveLength(3);
    expect(kinds.filter((k) => k === "penalty-goal")).toHaveLength(2);
  });

  it("holds the assist's place when nobody was credited with one", () => {
    // 22 of 32 carry an assist; the rest are unassisted, so the slot stays and holds null.
    expect(goals.every((g) => g.players.length === 2)).toBe(true);
    expect(goals.filter((g) => g.players[1] !== null)).toHaveLength(22);
  });

  it("orders the round on the wall clock and not on the match clock", () => {
    // Every match's clock starts at nought, so `seconds` alone misorders the day; `absolute` does not.
    const byAbsolute = [...goals].sort((a, b) => (a.absolute ?? 0) - (b.absolute ?? 0));
    const bySeconds = [...goals].sort((a, b) => a.seconds - b.seconds);
    expect(byAbsolute.map((g) => g.id)).not.toEqual(bySeconds.map((g) => g.id));
    expect(goals.every((g) => g.absolute !== null)).toBe(true);
  });

  it("gives every goal a stable id, so a poll does not redraw the wire", () => {
    expect(new Set(goals.map((g) => g.id)).size).toBe(goals.length);
    expect(mapRoundGoals(ROUND.content, roundCodes).map((g) => g.id)).toEqual(
      goals.map((g) => g.id),
    );
  });
});

// `/stats/match/128939`: the same Liverpool 2-2 Nottingham Forest, so the two files describe one match.
const STATS = recordedStats as unknown as RawPlMatchStats;

describe("plMatchMetrics", () => {
  const liverpool = plMatchMetrics(STATS, 10);
  const forest = plMatchMetrics(STATS, 15);

  it("reads a metric by Opta's own name", () => {
    expect(liverpool?.("possession_percentage")).toBe(69.1);
    expect(liverpool?.("total_scoring_att")).toBe(13);
  });

  it("answers NOUGHT for a metric they omitted, not undefined", () => {
    // Neither side was sent off, so `total_red_card` is absent from both; a dash would hedge a fact we hold.
    expect(liverpool?.("total_red_card")).toBe(0);
    expect(forest?.("total_red_card")).toBe(0);
    expect(STATS.data["10"].M.some((m) => m.name === "total_red_card")).toBe(false);
  });

  it("keys on the provider's team id and gives both sides", () => {
    expect(liverpool).not.toBeNull();
    expect(forest).not.toBeNull();
    expect(liverpool?.("goals")).toBe(2);
    expect(forest?.("goals")).toBe(2);
  });

  it("answers null for a fixture they have no stats for, which IS an absence", () => {
    // Distinct from the nought above: no stats at all may not become a board of noughts.
    expect(plMatchMetrics(STATS, 999)).toBeNull();
  });
});

describe("worthReading, against the recorded match", () => {
  const lines = plCommentary(PLAYED.events.content);

  it("keeps not one line of either foul type, nor an offside", () => {
    const kept = worthReading(lines);
    expect(kept.some((line) => line.type === "free kick won")).toBe(false);
    expect(kept.some((line) => line.type === "free kick lost")).toBe(false);
    expect(kept.some((line) => line.type === "offside")).toBe(false);
  });

  it("had offsides to take out, so the case above is not vacuous", () => {
    // A recorded match with no offsides would let the assertion pass on nothing.
    expect(lines.some((line) => line.type === "offside")).toBe(true);
  });

  it("takes out a large share of a real feed, which is the whole point", () => {
    // A floor, not a figure: the exact share is one afternoon's refereeing.
    const dropped = lines.length - worthReading(lines).length;
    expect(dropped / lines.length).toBeGreaterThan(0.2);
  });

  it("keeps every goal, card and substitution", () => {
    const kept = worthReading(lines);
    for (const type of ["goal", "yellow card", "substitution"]) {
      expect(kept.filter((line) => line.type === type)).toEqual(
        lines.filter((line) => line.type === type),
      );
    }
  });

  it("leaves the order alone", () => {
    const kept = worthReading(lines);
    expect(kept).toEqual(
      lines.filter((line) => !line.type.startsWith("free kick") && line.type !== "offside"),
    );
  });

  it("has nothing to do on an empty feed", () => {
    expect(worthReading([])).toEqual([]);
  });
});

describe("keyMoments, against every recorded match", () => {
  const feeds = [recordedStreams, assistStreams, spursVillaStream].flatMap(
    (recorded) => recorded as unknown as RawPlTextstream[],
  );

  it("never drops a goal, a card, a change, a penalty or a whistle", () => {
    const loud = /goal|card|substitution|penalty|^start$|^end \d+$/;
    for (const feed of feeds) {
      const lines = plCommentary(feed.events.content);
      expect(keyMoments(lines)).toEqual(lines.filter((line) => loud.test(line.type) || KEPT_ELSE.has(line.type)));
    }
  });

  it("leaves out the shots, corners, delays and added time", () => {
    const kept = new Set(feeds.flatMap((feed) => keyMoments(plCommentary(feed.events.content))).map((line) => line.type));
    for (const type of ["miss", "attempt saved", "attempt blocked", "corner", "start delay", "end delay", "added time"]) {
      expect(kept.has(type)).toBe(false);
    }
  });

  it("keeps a penalty missed, which Opta files as a plain miss", () => {
    const line = { id: 1, type: "miss", minute: "30", seconds: 1800, text: "Penalty missed! Bad penalty by X." };
    expect(keyMoments([line])).toEqual([line]);
  });
});

/** The two key types whose name says nothing loud: a VAR review and a man retired hurt. */
const KEPT_ELSE: ReadonlySet<string> = new Set(["contentious referee decisions", "player retired"]);
