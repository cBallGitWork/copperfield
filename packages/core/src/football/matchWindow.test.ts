import { describe, expect, it } from "vitest";
import { inMatchWindow, secondsToWindow } from "./matchWindow";

const WINDOW = { leadMinutes: 15, tailMinutes: 135 };

/** A Saturday in BST: 12:30, 15:00 and 17:30 London are 11:30, 14:00 and 16:30 UTC. */
const SATURDAY = ["2026-10-17T11:30:00Z", "2026-10-17T14:00:00Z", "2026-10-17T16:30:00Z"];

describe("inMatchWindow", () => {
  it("is closed at 02:00 on a day with no match", () => {
    expect(inMatchWindow(SATURDAY, "2026-10-15T01:00:00Z", WINDOW)).toBe(false);
    expect(inMatchWindow(SATURDAY, "2026-10-18T01:00:00Z", WINDOW)).toBe(false);
  });

  it("opens ten minutes before the day's first kickoff, and not sixteen", () => {
    expect(inMatchWindow(SATURDAY, "2026-10-17T11:20:00Z", WINDOW)).toBe(true);
    expect(inMatchWindow(SATURDAY, "2026-10-17T11:14:00Z", WINDOW)).toBe(false);
  });

  it("switches at its boundaries: open on the lead and the tail, closed a minute outside either", () => {
    expect(inMatchWindow(SATURDAY, "2026-10-17T11:15:00Z", WINDOW)).toBe(true);
    expect(inMatchWindow(SATURDAY, "2026-10-17T18:45:00Z", WINDOW)).toBe(true);
    expect(inMatchWindow(SATURDAY, "2026-10-17T18:46:00Z", WINDOW)).toBe(false);
  });

  it("stays open through the gaps between one day's kickoffs", () => {
    expect(inMatchWindow(SATURDAY, "2026-10-17T13:50:00Z", WINDOW)).toBe(true);
  });

  it("groups kickoffs by the London day either side of the clock change on 25 Oct", () => {
    // 00:30 BST on Sun 25 Oct is 23:30 UTC on the 24th; 14:00 GMT that afternoon is 14:00 UTC. One London day, one window.
    const sunday = ["2026-10-24T23:30:00Z", "2026-10-25T14:00:00Z"];
    expect(inMatchWindow(sunday, "2026-10-25T09:00:00Z", WINDOW)).toBe(true);
    // A Monday 20:00 GMT kickoff after the change is 20:00 UTC: the window opens at 19:45 UTC, not 18:45.
    const monday = ["2026-10-26T20:00:00Z"];
    expect(inMatchWindow(monday, "2026-10-26T19:45:00Z", WINDOW)).toBe(true);
    expect(inMatchWindow(monday, "2026-10-26T18:50:00Z", WINDOW)).toBe(false);
  });

  it("keeps a late kickoff's window open past London midnight", () => {
    expect(inMatchWindow(["2026-10-17T22:00:00Z"], "2026-10-18T00:10:00Z", WINDOW)).toBe(true);
  });

  it("ignores a kickoff it cannot read", () => {
    expect(inMatchWindow(["TBC"], "2026-10-17T14:00:00Z", WINDOW)).toBe(false);
  });
});

describe("secondsToWindow", () => {
  /** Saturday's three and Sunday's 14:00 BST (13:00 UTC). */
  const WEEKEND = [...SATURDAY, "2026-10-18T13:00:00Z"];

  it("is nought inside a window, the tea-time gap included", () => {
    expect(secondsToWindow(WEEKEND, "2026-10-17T11:15:00Z", WINDOW)).toBe(0);
    expect(secondsToWindow(WEEKEND, "2026-10-17T13:50:00Z", WINDOW)).toBe(0);
    expect(secondsToWindow(WEEKEND, "2026-10-17T18:45:00Z", WINDOW)).toBe(0);
  });

  it("counts down to the next window overnight, not to nought", () => {
    // Saturday's closes 18:45 UTC; Sunday's opens 12:45 UTC.
    expect(secondsToWindow(WEEKEND, "2026-10-17T18:46:00Z", WINDOW)).toBe(18 * 3600 - 60);
    expect(secondsToWindow(WEEKEND, "2026-10-18T12:44:15Z", WINDOW)).toBe(45);
  });

  it("is null with no football ahead, or a clock it cannot read", () => {
    expect(secondsToWindow(WEEKEND, "2026-10-18T15:16:00Z", WINDOW)).toBeNull();
    expect(secondsToWindow(WEEKEND, "TBC", WINDOW)).toBeNull();
    expect(secondsToWindow(["TBC"], "2026-10-17T11:00:00Z", WINDOW)).toBeNull();
  });
});
