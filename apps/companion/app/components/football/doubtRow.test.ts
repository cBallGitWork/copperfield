import { describe, expect, it } from "vitest";
import type { FootballPlayer } from "@epl/core";
import { fitnessOf } from "./doubtRow";

const man = (status: string, chanceOfPlaying: number | null, news = "Knock") =>
  ({ status, chanceOfPlaying, news }) as unknown as FootballPlayer;

describe("fitnessOf", () => {
  it("gives a doubt both its wash and its mark", () => {
    const { wash, mark } = fitnessOf(man("d", 25));
    expect(wash).toBe("cm-doubt-major");
    expect(mark?.state).toBe("doubt");
  });

  it("gives an injured man the out band", () => {
    expect(fitnessOf(man("i", 0)).wash).toBe("cm-doubt-out");
  });

  it("is silent for a fit man and one the bridge has not settled", () => {
    expect(fitnessOf(man("a", 100, ""))).toEqual({ wash: "", mark: null });
    expect(fitnessOf(null)).toEqual({ wash: "", mark: null });
  });
});
