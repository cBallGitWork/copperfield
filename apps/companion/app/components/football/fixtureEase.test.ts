import { describe, expect, it } from "vitest";
import { easeView, fixtureEase } from "./fixtureEase";

// Craig, 24 Oct 2026: "apply the coloured tiles repo wide". The planner's ramp, read for the man's side of the ball.
const ARS = 3;
const HUL = 88;

describe("fixtureEase", () => {
  it("reads the back line off the opponent's attack and everyone else off its defence", () => {
    expect(easeView(["G"])).toBe("defence");
    expect(easeView(["D", "M"])).toBe("defence");
    expect(easeView(["M", "F"])).toBe("attack");
  });

  it("puts a forward away at the best defence on red and away at the worst on green", () => {
    expect(fixtureEase("attack", ARS, false).ground).toBe("var(--color-ease-10)");
    expect(fixtureEase("attack", HUL, false).ground).toBe("var(--color-ease-1)");
  });

  it("leaves an unrated opponent on the quiet ground", () => {
    expect(fixtureEase("attack", null, true).ground).toBe("var(--color-raised)");
  });
});
