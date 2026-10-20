import { describe, expect, it } from "vitest";
import { fold, icsCalendar, icsInstant, icsText } from "./ics";
import { alarmsFor, feedAddresses, lockEvents } from "./locks";

const PERIODS = [
  { number: 8, start: "2026-10-16T04:00:00Z", end: "2026-10-23T03:59:59Z" },
  { number: 9, start: "2026-10-23T04:00:00Z", end: "2026-10-30T03:59:59Z" },
  { number: 10, start: "2026-10-30T04:00:00Z", end: "2026-11-06T03:59:59Z" },
];
const KICKOFFS = [
  { gameweek: 8, kickoff: "2026-10-17T14:00:00Z" },
  { gameweek: 9, kickoff: "2026-10-24T14:00:00Z" },
  { gameweek: 9, kickoff: "2026-10-23T19:00:00Z" },
  { gameweek: 10, kickoff: "2026-10-31T15:00:00Z" },
];
const NOW = "2026-10-19T12:00:00Z";

function feed(): string {
  return icsCalendar({
    prodId: "-//example.test//Line-up locks//EN",
    name: "Test League line-up locks",
    refreshHours: 3,
    stamp: NOW,
    events: lockEvents(PERIODS, KICKOFFS, NOW, "league1", "https://example.test/squad/me"),
  });
}

describe("the lock calendar", () => {
  it("writes one event per lock still ahead, each with its alarm an hour before", () => {
    expect(feed()).toBe(
      [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//example.test//Line-up locks//EN",
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH",
        "X-WR-CALNAME:Test League line-up locks",
        "REFRESH-INTERVAL;VALUE=DURATION:PT3H",
        "X-PUBLISHED-TTL:PT3H",
        "BEGIN:VEVENT",
        "UID:lock-9-league1",
        "DTSTAMP:20261019T120000Z",
        "DTSTART:20261023T184500Z",
        "DTEND:20261023T190000Z",
        "SUMMARY:Gameweek 9 line-ups lock",
        "URL:https://example.test/squad/me",
        "TRANSP:TRANSPARENT",
        "BEGIN:VALARM",
        "ACTION:DISPLAY",
        "DESCRIPTION:Gameweek 9 line-ups lock",
        "TRIGGER:-PT60M",
        "END:VALARM",
        "BEGIN:VALARM",
        "ACTION:DISPLAY",
        "DESCRIPTION:Gameweek 9 line-ups lock",
        "TRIGGER:-PT645M",
        "END:VALARM",
        "END:VEVENT",
        "BEGIN:VEVENT",
        "UID:lock-10-league1",
        "DTSTAMP:20261019T120000Z",
        "DTSTART:20261031T144500Z",
        "DTEND:20261031T150000Z",
        "SUMMARY:Gameweek 10 line-ups lock",
        "URL:https://example.test/squad/me",
        "TRANSP:TRANSPARENT",
        "BEGIN:VALARM",
        "ACTION:DISPLAY",
        "DESCRIPTION:Gameweek 10 line-ups lock",
        "TRIGGER:-PT60M",
        "END:VALARM",
        "BEGIN:VALARM",
        "ACTION:DISPLAY",
        "DESCRIPTION:Gameweek 10 line-ups lock",
        "TRIGGER:-PT345M",
        "END:VALARM",
        "END:VEVENT",
        "END:VCALENDAR",
        "",
      ].join("\r\n"),
    );
  });

  it("keeps a gameweek's UID when its first kickoff moves, so a re-fetch moves the event", () => {
    const moved = KICKOFFS.map((each) => (each.kickoff === "2026-10-23T19:00:00Z" ? { ...each, kickoff: "2026-10-24T11:30:00Z" } : each));
    const [event] = lockEvents(PERIODS, moved, NOW, "league1", "https://example.test/squad/me");
    expect(event).toMatchObject({ uid: "lock-9-league1", at: "2026-10-24T11:15:00.000Z" });
  });

  it("drops a lock already passed and a period with no football", () => {
    const events = lockEvents(PERIODS, KICKOFFS.slice(0, 1), NOW, "league1", "u");
    expect(events).toEqual([]);
  });

  it("ends every line with CRLF and never a bare LF", () => {
    expect(feed().replace(/\r\n/g, "")).not.toMatch(/[\r\n]/);
  });
});

describe("alarmsFor", () => {
  it("adds 09:00 London on lock day, in summer time and after the clock change", () => {
    expect(alarmsFor("2026-10-23T18:45:00Z")).toEqual([60, 645]);
    expect(alarmsFor("2026-10-31T14:45:00Z")).toEqual([60, 345]);
  });

  it("keeps the hour-before alarm alone for a lock before 10:00 London", () => {
    expect(alarmsFor("2026-12-26T09:15:00Z")).toEqual([60]);
    expect(alarmsFor("2026-08-22T09:00:00Z")).toEqual([60]);
  });
});

describe("feedAddresses", () => {
  it("gives a phone webcal: and anything else the https: address of the same feed", () => {
    expect(feedAddresses("https://example.test")).toEqual({
      webcal: "webcal://example.test/calendar.ics",
      https: "https://example.test/calendar.ics",
    });
  });
});

describe("iCalendar text", () => {
  it("escapes backslashes, semicolons, commas and newlines", () => {
    expect(icsText("a\\b;c,d\ne")).toBe("a\\\\b\\;c\\,d\\ne");
  });

  it("writes an instant in UTC with a Z, whatever offset it came in", () => {
    expect(icsInstant("2026-10-23T14:45:00-0400")).toBe("20261023T184500Z");
  });

  it("folds at 75 octets, each continuation opening with a space", () => {
    const folded = fold(`SUMMARY:${"x".repeat(150)}`);
    const lines = folded.split("\r\n");
    expect(lines.map((line) => line.length)).toEqual([75, 75, 10]);
    expect(lines.slice(1).every((line) => line.startsWith(" "))).toBe(true);
    expect(folded.replace(/\r\n /g, "")).toBe(`SUMMARY:${"x".repeat(150)}`);
  });

  it("never folds inside a character: octets are counted, not letters", () => {
    const folded = fold(`SUMMARY:${"é".repeat(40)}`);
    const octets = folded.split("\r\n").map((line) => new TextEncoder().encode(line).length);
    expect(octets.every((size) => size <= 75)).toBe(true);
    expect(folded.replace(/\r\n /g, "")).toBe(`SUMMARY:${"é".repeat(40)}`);
  });

  it("leaves a line of 75 octets whole", () => {
    expect(fold("x".repeat(75))).toBe("x".repeat(75));
  });
});
