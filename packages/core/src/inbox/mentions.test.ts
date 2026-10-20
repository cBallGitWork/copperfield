import { describe, expect, it } from "vitest";
import { bodySpans } from "./mentions";

const colwill = { text: "Levi Colwill", fantraxId: "f1" };
const beef = { text: "Beef", teamId: "t1" };

describe("bodySpans", () => {
  it("cuts the body at each name it links, keeping every word", () => {
    const body = "Beef have signed Chelsea's Levi Colwill as a free agent.";
    const spans = bodySpans(body, [colwill, beef]);
    expect(spans).toEqual([
      { text: "Beef", mention: beef },
      { text: " have signed Chelsea's ", mention: null },
      { text: "Levi Colwill", mention: colwill },
      { text: " as a free agent.", mention: null },
    ]);
    expect(spans.map((span) => span.text).join("")).toBe(body);
  });

  it("is the whole body unlinked when no name is in it", () => {
    expect(bodySpans("The trade has gone through.", [colwill])).toEqual([
      { text: "The trade has gone through.", mention: null },
    ]);
  });

  it("links the longer name where two start at one place", () => {
    const short = { text: "Dome", teamId: "t2" };
    const long = { text: "Dome Italy", teamId: "t3" };
    expect(bodySpans("Dome Italy have signed him.", [short, long])[0]).toEqual({ text: "Dome Italy", mention: long });
  });

  it("ignores a name with no text", () => {
    expect(bodySpans("Beef", [{ text: "", teamId: "t9" }])).toEqual([{ text: "Beef", mention: null }]);
  });

  it("never links a name inside a longer word", () => {
    const bru = { text: "Bru", teamId: "t4" };
    expect(bodySpans("Bru have signed Club Brugge's man.", [bru])).toEqual([
      { text: "Bru", mention: bru },
      { text: " have signed Club Brugge's man.", mention: null },
    ]);
  });
});
