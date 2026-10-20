// iCalendar (RFC 5545) text: CRLF lines folded at 75 octets, TEXT escaped, every instant in UTC.

/** One reminder in the feed: any kind of event, so a later one (a waiver run) joins without a format change. */
export interface CalendarEvent {
  /** Stable across fetches, so a re-fetch moves the event rather than adding a second. */
  uid: string;
  title: string;
  /** ISO instant the event starts. */
  at: string;
  /** ISO instant it ends; none is an instant event. */
  end?: string;
  url?: string;
  /** Minutes before `at` each alarm sounds. */
  alarms: readonly number[];
}

export interface Calendar {
  prodId: string;
  name: string;
  /** How often a subscriber should fetch again. */
  refreshHours: number;
  /** ISO instant the feed was written, every event's DTSTAMP. */
  stamp: string;
  events: readonly CalendarEvent[];
}

const CRLF = "\r\n";
const FOLD_OCTETS = 75;
const encoder = new TextEncoder();

/** A TEXT value with its backslashes, semicolons, commas and newlines escaped. */
export function icsText(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r\n|\r|\n/g, "\\n");
}

/** An ISO instant as a UTC DATE-TIME, `20261023T183000Z`. */
export function icsInstant(iso: string): string {
  return new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

/** One content line folded at 75 octets, never inside a character: each continuation opens with a space. */
export function fold(line: string): string {
  let out = "";
  let width = 0;
  for (const char of line) {
    const size = encoder.encode(char).length;
    if (width + size > FOLD_OCTETS) {
      out += `${CRLF} `;
      width = 1;
    }
    out += char;
    width += size;
  }
  return out;
}

function eventLines(event: CalendarEvent, stamp: string): string[] {
  const title = icsText(event.title);
  return [
    "BEGIN:VEVENT",
    `UID:${event.uid}`,
    `DTSTAMP:${icsInstant(stamp)}`,
    `DTSTART:${icsInstant(event.at)}`,
    ...(event.end === undefined ? [] : [`DTEND:${icsInstant(event.end)}`]),
    `SUMMARY:${title}`,
    ...(event.url === undefined ? [] : [`URL:${event.url}`]),
    "TRANSP:TRANSPARENT",
    ...event.alarms.flatMap((minutes) => [
      "BEGIN:VALARM",
      "ACTION:DISPLAY",
      `DESCRIPTION:${title}`,
      `TRIGGER:-PT${minutes}M`,
      "END:VALARM",
    ]),
    "END:VEVENT",
  ];
}

/** The whole feed, CRLF after every line, the last included. */
export function icsCalendar(calendar: Calendar): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:${calendar.prodId}`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${icsText(calendar.name)}`,
    `REFRESH-INTERVAL;VALUE=DURATION:PT${calendar.refreshHours}H`,
    `X-PUBLISHED-TTL:PT${calendar.refreshHours}H`,
    ...calendar.events.flatMap((event) => eventLines(event, calendar.stamp)),
    "END:VCALENDAR",
  ];
  return lines.map(fold).join(CRLF) + CRLF;
}
