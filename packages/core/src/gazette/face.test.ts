import { describe, expect, it } from "vitest";
import { normalizeFace } from "./face";

const face = { code: 223094, name: "Haaland", clubId: 13, position: "F" };

describe("normalizeFace", () => {
  it("keeps a whole face, and reads a missing position as none", () => {
    expect(normalizeFace(face)).toEqual(face);
    expect(normalizeFace({ ...face, position: 7 })).toEqual({ ...face, position: null });
  });

  it("refuses a code or a club that is not a real FPL one: zero, negative or fractional", () => {
    for (const bad of [0, -3, 1.5]) {
      expect(normalizeFace({ ...face, code: bad })).toBeNull();
      expect(normalizeFace({ ...face, clubId: bad })).toBeNull();
    }
  });
});
