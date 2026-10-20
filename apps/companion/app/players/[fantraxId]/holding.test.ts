import { describe, expect, it } from "vitest";
import { holding } from "./holding";

// 19 Oct 2026: a man nobody holds read "Held by Waivers" and "Held by Free agent".
describe("the transfer panel's first line", () => {
  it("names the team holding him", () => {
    expect(holding("The Raccoons", "T")).toEqual({ label: "Held by", value: "The Raccoons" });
  });

  it("gives a free man's status in plain words, not as his holder", () => {
    expect(holding(null, "WW")).toEqual({ label: "Status", value: "On waivers" });
    expect(holding(null, "FA")).toEqual({ label: "Status", value: "Free agent" });
  });

  it("is absent when Fantrax gave no status", () => {
    expect(holding(null, "")).toEqual({ label: "Status", value: null });
  });
});
