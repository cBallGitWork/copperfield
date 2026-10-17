import { describe, expect, it } from "vitest";
import { repeatsIn } from "./repeats";

const kinds = (prose: string, names: string[] = []) => repeatsIn([{ code: 1, prose }], names).map((r) => `${r.kind}: ${r.said}`);

describe("repeatsIn", () => {
  it("hears a phrase said twice in one match", () => {
    expect(kinds("Barnes set up the first goal. Later Barnes set up the second one too.", ["Barnes"])).toContain("phrase: set up the");
  });

  it("hears a word leaned on three times in a match", () => {
    expect(kinds("He created one chance. Kudus created another. Robertson created four.", ["Kudus", "Robertson"])).toContain("word: created");
  });

  it("hears two sentences that open the same way", () => {
    expect(kinds("He had four shots. He had three chances.")).toContain("opener: he had");
  });

  it("never counts a name, or the football nouns a report cannot do without", () => {
    expect(kinds("Manzambi scored a goal. Manzambi made a goal. Manzambi won a goal back.", ["Manzambi"]).filter((k) => k.includes("manzambi") || k.includes("goal"))).toEqual([]);
  });

  it("never counts the plain nouns a match needs, so the writer has no cause for flag-kick or the passer", () => {
    const prose = "Groß took the corner and Vuskovic headed the cross wide. Rice played the pass from a corner, and his shot was saved. Another corner, another pass, another shot saved by the keeper in the area.";
    expect(kinds(prose, ["Groß", "Vuskovic", "Rice"]).filter((k) => k.startsWith("word"))).toEqual([]);
  });

  it("names the later sentences, the ones to rewrite", () => {
    const [phrase] = repeatsIn([{ code: 1, prose: "Villa led three-nil late. It finished with Villa led three-nil late." }], []).filter((r) => r.kind === "phrase");
    expect(phrase.later).toEqual(["It finished with Villa led three-nil late."]);
  });

  it("hears a word leaned on across the page", () => {
    const pieces = [1, 2, 3].map((code) => ({ code, prose: `He was clinical. He looked clinical again.` }));
    expect(repeatsIn(pieces, []).some((r) => r.code === null && r.said === "clinical")).toBe(true);
  });
});
