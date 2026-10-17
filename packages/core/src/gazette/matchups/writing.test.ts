import { describe, expect, it } from "vitest";
import { mergeDraft, readDraftWriting } from "./writing";

describe("readDraftWriting", () => {
  it("reads each piece by its number, drops empty paragraphs, and keeps only puns that name their word", () => {
    const writing = readDraftWriting({
      headlineStory: "123 edged test2",
      headlines: [{ text: "Haaland the last word", playsOn: "last", twoMeanings: "final, and latest" }, { text: "A plain line" }],
      pieces: [{ number: 1, paragraphs: ["One.", "", "Two."] }, { number: "x" }],
    });
    expect(writing.headlines).toEqual(["Haaland the last word"]);
    expect(writing.matchups.get(1)).toEqual({ paragraphs: ["One.", "Two."] });
    expect(writing.matchups.size).toBe(1);
  });
});

describe("mergeDraft", () => {
  const piece = (tag: string) => ({ paragraphs: [tag] });
  const writing = (tag: string) => ({ headlines: [], meanings: {}, headlineStory: "", matchups: new Map([[1, piece(tag)], [2, piece(tag)]]) });
  it("keeps a clean first attempt and a better rewrite", () => {
    const first = { writing: writing("first"), faults: [{ section: "2:matchup", check: "x", severity: "send-back" as const, evidence: "" }] };
    const second = { writing: writing("second"), faults: [] };
    expect([...mergeDraft([first, second], 2).values()].map((p) => p.paragraphs[0])).toEqual(["first", "second"]);
  });

  // GW6's lead printed its score alone: both attempts named a true 7 the brief never gave.
  it("when both break a hard rule, prints the attempt with fewer, the faulting sentences cut", () => {
    const told = (paragraphs: string[]) => ({ headlines: [], meanings: {}, headlineStory: "", matchups: new Map([[1, { paragraphs }]]) });
    const figure = (evidence: string) => ({ section: "1:matchup", check: "a figure the brief does not give", severity: "hard" as const, evidence });
    const first = { writing: told(["Kamada's eight sat on the bench.", "Kadıoğlu kept a clean sheet for 7. Rice made one."]), faults: [figure("7")] };
    const second = { writing: told(["Kamada's eight sat on the bench. Vuskovic took seven.", "Bassey lost 4 late."]), faults: [figure("7"), figure("4")] };
    expect(mergeDraft([first, second], 1).get(1)).toEqual({ paragraphs: ["Kamada's eight sat on the bench.", "Rice made one."] });
  });

  it("prints nothing for a match-up whose lede carries the fault", () => {
    const told = { headlines: [], meanings: {}, headlineStory: "", matchups: new Map([[1, { paragraphs: ["Seven for Kadıoğlu. Rice made one."] }]]) };
    const fault = { section: "1:matchup", check: "x", severity: "hard" as const, evidence: "7" };
    expect(mergeDraft([{ writing: told, faults: [fault] }], 1).has(1)).toBe(false);
  });
});
