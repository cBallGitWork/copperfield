import { describe, expect, it } from "vitest";
import { yoursFirst, yoursInset } from "./mine";

describe("yoursFirst", () => {
  it("lifts yours to the top and keeps everyone else's order", () => {
    expect(yoursFirst(["a", "b", "c", "d"], (x) => x === "c")).toEqual(["c", "a", "b", "d"]);
  });

  it("hands the list back untouched to a reader who owns nothing", () => {
    expect(yoursFirst(["b", "a"], () => false)).toEqual(["b", "a"]);
  });
});

describe("yoursInset", () => {
  it("paints the reader's edge inside the cell, taking no width and no box-shadow", () => {
    expect(yoursInset(true)).toBe("bg-[linear-gradient(to_right,var(--color-accent)_4px,transparent_4px)]");
    expect(yoursInset(true)).not.toMatch(/border|shadow/);
  });

  it("leaves every other row's cell bare, so a collapsed table's row rule runs through", () => {
    expect(yoursInset(false)).toBe("");
  });
});
