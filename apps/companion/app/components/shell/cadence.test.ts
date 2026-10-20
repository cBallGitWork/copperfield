import { describe, expect, it } from "vitest";
import { nextPoll, settleAfter } from "./cadence";

const rates = { live: 30, idle: 300 };

describe("nextPoll", () => {
  it("idles with no football ahead", () => {
    expect(nextPoll(null, 0, rates)).toBe(300);
  });

  it("wakes at a kickoff closer than the idle rate", () => {
    expect(nextPoll(45, 0, rates)).toBe(45);
    expect(nextPoll(100, 55, rates)).toBe(45);
  });

  it("idles when the kickoff is further than the idle rate", () => {
    expect(nextPoll(400, 0, rates)).toBe(300);
  });

  it("polls at the live rate once the kickoff has passed", () => {
    expect(nextPoll(0, 0, rates)).toBe(30);
    expect(nextPoll(45, 60, rates)).toBe(30);
  });
});

// Craig, 19 Oct 2026: "when opening app, sometimes still needs a pull refresh to get the latest scores update".
describe("settleAfter", () => {
  const rules = { lifetime: 20, settle: 4 };

  it("asks again soon after a cold open inside a match window", () => {
    expect(settleAfter(0, 0, null, rules)).toBe(4);
  });

  it("asks again after a return longer than a live read's lifetime", () => {
    expect(settleAfter(0, 600, 21, rules)).toBe(4);
    expect(settleAfter(45, 60, 300, rules)).toBe(4);
  });

  it("leaves a return inside the lifetime to the first refresh", () => {
    expect(settleAfter(0, 600, 20, rules)).toBeNull();
  });

  it("never asks twice outside a match window", () => {
    expect(settleAfter(null, 0, null, rules)).toBeNull();
    expect(settleAfter(400, 0, 600, rules)).toBeNull();
  });
});
