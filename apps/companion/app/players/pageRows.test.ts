import { describe, expect, it } from "vitest";
import { pageRows } from "./pageRows";
import { PAGE_ROWS } from "./query";

describe("pageRows", () => {
  const shown = Array.from({ length: PAGE_ROWS + 5 }, (_, at) => at);

  it("draws the first page unless asked for all", () => {
    expect(pageRows(shown, {})).toHaveLength(PAGE_ROWS);
  });

  it("draws every row for ?all=1", () => {
    expect(pageRows(shown, { all: "1" })).toHaveLength(shown.length);
  });

  it("reads any other value as the first page, so ?all=0 is not all", () => {
    expect(pageRows(shown, { all: "0" })).toHaveLength(PAGE_ROWS);
    expect(pageRows(shown, { all: "yes" })).toHaveLength(PAGE_ROWS);
  });
});
