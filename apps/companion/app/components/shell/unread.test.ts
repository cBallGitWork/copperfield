import { describe, expect, it } from "vitest";
import { shouldRecord, unreadCount, unreadText } from "./unread";

describe("unread mail", () => {
  it("counts the items this device has not seen", () => {
    expect(unreadCount(["a", "b", "c"], new Set(["a"]))).toBe(2);
  });

  it("starts a device that has never opened Mail at nought", () => {
    expect(unreadCount(["a", "b", "c"], null)).toBe(0);
  });

  it("ignores items seen that have since left the inbox", () => {
    expect(unreadCount(["b"], new Set(["a", "b"]))).toBe(0);
  });

  it("caps the figure at 9+", () => {
    expect(unreadText(3)).toBe("3");
    expect(unreadText(9)).toBe("9");
    expect(unreadText(12)).toBe("9+");
  });

  it("records the inbox on a visit to Mail, or on a device's first visit", () => {
    expect(shouldRecord(["a"], true, false)).toBe(true);
    expect(shouldRecord(["a"], false, true)).toBe(true);
    expect(shouldRecord(["a"], false, false)).toBe(false);
  });

  it("records nothing when the inbox could not be read, so a failed read never wipes what was seen", () => {
    expect(shouldRecord(null, true, false)).toBe(false);
    expect(shouldRecord(null, false, true)).toBe(false);
  });
});
