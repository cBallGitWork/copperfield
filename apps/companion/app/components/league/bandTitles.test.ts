import { describe, expect, it } from "vitest";
import type { CategoryBand } from "@epl/core";
import { bandTitles } from "./bandTitles";

const band = (code: string, name: string, mine: string[], theirs: string[] = []): CategoryBand => ({
  code,
  name,
  mine: mine.map((fantraxId) => ({ fantraxId, points: -1 })),
  theirs: theirs.map((fantraxId) => ({ fantraxId, points: -1 })),
});

const slots: Record<string, string> = { keeper: "G", back: "D", back2: "D", mid: "M" };
const slotOf = (id: string) => slots[id];

describe("a band's plate title", () => {
  // Review M42: "GOALS CONCEDED" twice on the board, with no slot to tell them apart.
  it("names the slots where two bands share a name", () => {
    const titles = bandTitles([band("GAO", "Goals conceded", ["back", "mid"], ["back2"]), band("GA", "Goals conceded", ["keeper"])], slotOf);
    expect(titles.get("GAO")).toBe("Goals conceded · DEF/MID");
    expect(titles.get("GA")).toBe("Goals conceded · GK");
  });

  it("leaves a band with a name of its own alone", () => {
    expect(bandTitles([band("G", "Goals", ["mid"])], slotOf).get("G")).toBe("Goals");
  });

  it("falls back on the code where no man's slot is known", () => {
    const titles = bandTitles([band("GAO", "Goals conceded", ["nobody"]), band("GA", "Goals conceded", ["keeper"])], slotOf);
    expect(titles.get("GAO")).toBe("Goals conceded · GAO");
  });
});
