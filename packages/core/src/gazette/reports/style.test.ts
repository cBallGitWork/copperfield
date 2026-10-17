import { describe, expect, it } from "vitest";
import { REPORT_NEVER, dayFaults, wordFaults } from "./style";

const faultsIn = (text: string) => {
  const out: string[] = [];
  wordFaults("x", text, true, [], (_, check, __, evidence) => out.push(`${check}: ${evidence}`));
  return out;
};

describe("wordFaults", () => {
  it("sends a banned phrase back once, however many lists carry it", () => {
    expect(faultsIn("Their profligacy cost them.")).toEqual(["a phrase this paper does not print: profligacy"]);
    expect(new Set(REPORT_NEVER).size).toBe(REPORT_NEVER.length);
  });

  it("catches the Englishman as it catches the Frenchman", () => {
    expect(faultsIn("The Englishman scored.")).toContain("a man called anything but his name: The Englishman");
    expect(faultsIn("The Frenchman scored.")).toContain("a man called anything but his name: The Frenchman");
  });
});

describe("dayFaults' caps", () => {
  const capped = (pieces: string[]) => {
    const out: string[] = [];
    dayFaults(pieces.map((prose, i) => ({ code: i + 1, prose, account: prose, standfirst: "" })), [], "", [], 99, (section, check, __, evidence) => out.push(`${section} ${check}: ${evidence}`));
    return out.filter((f) => f.includes("used too often"));
  };

  it("lets every match join its moments with minutes later once, and no match twice", () => {
    expect(capped(["Rice scored. Minutes later Saka scored.", "Kane scored. Minutes later Son scored.", "Wood scored. Minutes later Elanga scored."])).toEqual([]);
    expect(capped(["Rice scored. Minutes later Saka scored, and minutes later Odegaard scored."])).toEqual(["1:match a phrase used too often in one match: minutes later ×2"]);
  });

  it("sends back elegant variation for a football noun", () => {
    expect(faultsIn("Groß swung in a flag-kick and the passer was Rice.")).toEqual(["a phrase this paper does not print: flag-kick", "a phrase this paper does not print: the passer"]);
  });
});
