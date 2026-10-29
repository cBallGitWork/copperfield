import { describe, expect, it } from "vitest";
import type { RosterSlot } from "../types";
import roster from "./__fixtures__/lineupState.json";
import saved from "./__fixtures__/lineupSaved.json";
import { mapLineupState, type LineupState, type WriteAnswer } from "./lineupWrite";
import { writeLineup, type LineupPort, type PlannedLineup, type SaveStep } from "./lineupSave";

// The save's steps replayed through a fake port: Fantrax's real answers, recorded, and the refusals it can give.
const read = mapLineupState(roster) as LineupState;
const PERIOD = 6;
const STATUS: Record<string, string> = { "1": "ACTIVE", "2": "RESERVE" };
const POSITION: Record<string, string> = { "701": "F", "702": "M", "703": "D", "704": "G" };
const asIs = (): RosterSlot[] =>
  read.rows.map((row) => ({ fantraxId: row.scorerId, position: POSITION[row.posId]!, status: STATUS[row.statusId]! }));
const reservesOf = (slots: RosterSlot[]) => slots.filter((s) => s.status === "RESERVE").map((s) => s.fantraxId);
const move = (plan: RosterSlot[], id: string, status: string) => plan.map((s) => (s.fantraxId === id ? { ...s, status } : s));

const held = { slots: asIs(), bench: reservesOf(asIs()) };
/** 04qfz drops to the bench and 05l27 comes in, both defenders. */
const swapped = move(move(asIs(), "04qfz", "RESERVE"), "05l27", "ACTIVE");
const plan = (patch: Partial<PlannedLineup> = {}): PlannedLineup => ({
  slots: swapped,
  bench: reservesOf(swapped),
  reordered: true,
  held,
  ...patch,
});

const REFUSAL = { fantasyResponse: { msgType: "WARNING", mainMsg: "Too many D" } };
const BENCH_REFUSAL = { success: false, fantasyResponse: { mainMsg: "No" } };

/** A port answering from a script, recording every call in order. */
function port(answers: { state?: unknown; dry?: unknown; lineup?: unknown; bench?: unknown | Error } = {}) {
  const calls: string[] = [];
  const fake: LineupPort = {
    state: async () => (calls.push("state"), answers.state ?? roster),
    sendLineup: async ({ dryRun }) => (calls.push(dryRun ? "dry-run" : "lineup"), dryRun ? (answers.dry ?? saved) : (answers.lineup ?? saved)),
    sendBench: async () => {
      calls.push("bench");
      if (answers.bench instanceof Error) throw answers.bench;
      return answers.bench ?? { success: true };
    },
  };
  return { fake, calls };
}

async function save(answers: Parameters<typeof port>[0], planned = plan(), period = PERIOD) {
  const { fake, calls } = port(answers);
  const steps: [SaveStep, WriteAnswer][] = [];
  const result = await writeLineup(fake, period, planned, (step, answer) => steps.push([step, answer]));
  return { result, calls, steps };
}

describe("writeLineup", () => {
  it("asks Fantrax first, then writes the lineup, then the bench, and marks the page stale", async () => {
    const { result, calls, steps } = await save({});
    expect(calls).toEqual(["state", "dry-run", "lineup", "bench"]);
    expect(steps.map(([step]) => step)).toEqual(["lineup", "bench"]);
    expect(result).toEqual({ outcome: "answered", answer: { ok: true }, stale: true });
  });

  it("writes nothing when the dry run is refused, and leaves the page as it is", async () => {
    const { result, calls, steps } = await save({ dry: REFUSAL });
    expect(calls).toEqual(["state", "dry-run"]);
    expect(steps).toEqual([["dry-run", { ok: false, messages: ["Too many D"] }]]);
    expect(result).toMatchObject({ outcome: "answered", answer: { ok: false }, stale: false });
  });

  it("stops before the bench when the real write is refused", async () => {
    const { result, calls } = await save({ lineup: REFUSAL });
    expect(calls).toEqual(["state", "dry-run", "lineup"]);
    expect(result).toMatchObject({ outcome: "answered", answer: { ok: false }, stale: false });
  });

  it("marks the page stale when the lineup went through and the bench was refused", async () => {
    const { result, steps } = await save({ bench: BENCH_REFUSAL });
    expect(steps.map(([step, answer]) => [step, answer.ok])).toEqual([["lineup", true], ["bench", false]]);
    expect(result).toEqual({ outcome: "answered", answer: { ok: false, messages: ["No"] }, stale: true });
  });

  it("leaves the page alone when only the bench was sent and refused", async () => {
    const { result, calls } = await save({ bench: BENCH_REFUSAL }, plan({ slots: asIs(), bench: [...held.bench].reverse() }));
    expect(calls).toEqual(["state", "bench"]);
    expect(result).toMatchObject({ outcome: "answered", stale: false });
  });

  it("sends nothing for a plan that changes nothing and an unnumbered bench left alone", async () => {
    const { result, calls } = await save({}, plan({ slots: asIs(), bench: held.bench, reordered: false }));
    expect(calls).toEqual(["state"]);
    expect(result).toEqual({ outcome: "answered", answer: { ok: true }, stale: true });
  });

  it("reports the lineup step before a bench call that throws, so the audit shows the lineup was written", async () => {
    const { fake } = port({ bench: new Error("network") });
    const steps: SaveStep[] = [];
    await expect(writeLineup(fake, PERIOD, plan(), (step) => steps.push(step))).rejects.toThrow("network");
    expect(steps).toEqual(["lineup"]);
  });

  it("refuses a page that is behind what Fantrax now holds, before any write", async () => {
    const behind = { slots: move(asIs(), "04qfz", "RESERVE"), bench: held.bench };
    const { result, calls } = await save({}, plan({ held: behind }));
    expect(result).toEqual({ outcome: "moved-on" });
    expect(calls).toEqual(["state"]);
  });

  it("refuses a roster it cannot read, or one filed for another period", async () => {
    expect((await save({ state: {} })).result).toEqual({ outcome: "unreadable" });
    expect((await save({}, plan(), PERIOD + 1)).result).toEqual({ outcome: "unreadable" });
  });

  it("refuses a plan naming a man Fantrax does not hold", async () => {
    const stranger = [...swapped.slice(1), { fantraxId: "zzzzz", position: "D", status: "ACTIVE" }];
    const { result, calls } = await save({}, plan({ slots: stranger }));
    expect(result).toEqual({ outcome: "unplaceable" });
    expect(calls).toEqual(["state"]);
  });
});
