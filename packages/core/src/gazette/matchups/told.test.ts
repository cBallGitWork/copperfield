import { describe, expect, it } from "vitest";
import { contextOf } from "./__fixtures__/context";
import { draftMan } from "./__fixtures__/draftMan";
import { draftSide, eleven } from "./__fixtures__/draftSide";
import { retold, toldBlock } from "./told";

// GW6: the 10 Oct Prem Report told Dewsbury-Hall's 11 points, and the draft report told them again.
const TOLD = [{ head: "Dewsbury-Hall", pitch: "Kiernan Dewsbury-Hall scored and set one up.", stake: "That earned The Raccoons 11 points." }];
const ctx = contextOf(draftSide("The Raccoons", 50, eleven("r", { 1: draftMan("Dewsbury-Hall", "M", 11, 90, 0, { goals: 1, assists: 1 }) })), draftSide("123", 40, eleven("o")));
const checked = (line: string) => retold({ paragraphs: [line] }, ctx, 0, TOLD).map((f) => `${f.section} ${f.check}: ${f.evidence}`);

describe("retold", () => {
  it("sends back a man's points a Prem Report already printed, in figures or words", () => {
    expect(checked("Dewsbury-Hall's 11-point haul settled it.")).toEqual(["1:matchup a man's points a Prem Report already printed: Dewsbury-Hall's 11-point haul settled it."]);
    expect(checked("Dewsbury-Hall made eleven points.")).toHaveLength(1);
  });

  it("lets him be told through what he decided, without the figure", () => {
    expect(checked("Dewsbury-Hall decided it before the bench could.")).toEqual([]);
  });

  it("leaves a man no Prem Report told", () => {
    expect(retold({ paragraphs: ["Dewsbury-Hall's 11 points settled it."] }, ctx, 0, [])).toEqual([]);
  });
});

describe("toldBlock", () => {
  it("hands the writer each man's line as already printed, and nothing when there is none", () => {
    expect(toldBlock(TOLD)).toContain("- Dewsbury-Hall: That earned The Raccoons 11 points.");
    expect(toldBlock([])).toBeNull();
  });
});
