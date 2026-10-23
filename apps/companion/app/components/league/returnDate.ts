import { readNote } from "@epl/core";

/** "Back 28 Nov" off FPL's note: the day it expects him back, or the day a ban ends; null where it names no day. */
export function returnDate(news: string): string | null {
  const reading = readNote(news);
  if (reading.kind === "ban") return reading.until === null ? null : `Back ${reading.until}`;
  if (reading.kind === "injury" && typeof reading.outlook === "object" && "back" in reading.outlook) {
    return `Back ${reading.outlook.back}`;
  }
  return null;
}
