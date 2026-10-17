import { describe, expect, it } from "vitest";
import { fallEchoes, fallLines } from "./opening";

// GW6's archived opening, then the season rankings', newest first, as the desk hands them over.
const COLUMNS = [
  "Five ties, not a ball kicked. Twenty-two years doing this on the BBC, and now it's a draft league's paper named after a doughnut shop.\nCold Palmer are soft.",
  "Twenty-two years predicting scores on the BBC. Now I rank fantasy squads for a paper named after doughnuts. Nobody is clear.",
];
const FACTS = "You are Mark Lawrenson. Twenty-two years at the BBC, and now a fantasy draft league's paper. Five ties, named exactly as here, after the lock.";

describe("fallLines", () => {
  it("finds the fall line in each column's opening, and never in a tie", () => {
    expect(fallLines([...COLUMNS, "Two from five.\nTwenty-two years and Cold Palmer still cannot defend."])).toEqual([
      "Twenty-two years doing this on the BBC, and now it's a draft league's paper named after a doughnut shop.",
      "Twenty-two years predicting scores on the BBC.",
      "Now I rank fantasy squads for a paper named after doughnuts.",
    ]);
  });
});

describe("fallEchoes", () => {
  it("sends back the picture an earlier fall line invented, plural or not", () => {
    expect(fallEchoes("One from five. Twenty-two years on the BBC, and now a coffee shop's doughnut marks me.", COLUMNS, FACTS)).toEqual(["shop", "doughnut"]);
  });

  it("keeps the joke itself: the BBC, the years and the paper are his to say every week", () => {
    expect(fallEchoes("One from five. Twenty-two years on the BBC, and now a fantasy paper reads my post.", COLUMNS, FACTS)).toEqual([]);
  });

  it("does not count the brief's own list of his fall lines as a fact", () => {
    const brief = `${FACTS}\n${fallLines(COLUMNS).map((line) => `- ${line}`).join("\n")}`;
    expect(fallEchoes("Now a doughnut paper.", COLUMNS, brief)).toEqual(["doughnut"]);
  });
});
