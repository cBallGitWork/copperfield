import { FANTRAX_TIMEZONE } from "../../config";
import type { WaiverSchedule } from "../types";
import { hourOfDay } from "./stamp";

// `getLeagueSetup {action: "transactions"}` → when the league's waiver claims run. The payload names no zone; the
// clock is Fantrax's own, US Eastern, as every stamp they print is. Pure.

/** The setup's waiver block; only what places a run is read. */
interface RawWaiverWire {
  /** `DAYS_OF_WEEK` runs on set days; `NUM_DAYS` clears each man a set number of days after he is dropped. */
  waiverWireProcessType?: string;
  /** Fantrax's weekday codes, "1" Sunday to "7" Saturday. */
  waiverWireClaimResolutionDays?: string[];
  /** A twelve-hour clock: 1, 0 and "PM" is 1:00 PM. */
  waiverWireClaimResolutionTimeHour?: number;
  waiverWireClaimResolutionTimeMinute?: number;
  waiverWireClaimResolutionTimeAmPm?: string;
}

export interface RawWaiverSettings {
  waiverWire?: RawWaiverWire;
}

/** The weekly run, or null for a league that does not run on set days or a block that does not read. */
export function mapWaiverSchedule(raw: RawWaiverSettings): WaiverSchedule | null {
  const wire = raw.waiverWire;
  if (wire?.waiverWireProcessType !== "DAYS_OF_WEEK") return null;

  const codes = (wire.waiverWireClaimResolutionDays ?? []).map(Number).filter((code) => Number.isInteger(code) && code >= 1 && code <= 7);
  const weekdays = [...new Set(codes.map((code) => code - 1))].sort((a, b) => a - b);
  const hour = wire.waiverWireClaimResolutionTimeHour;
  const minute = wire.waiverWireClaimResolutionTimeMinute;
  const meridiem = /^([ap])m$/i.exec(wire.waiverWireClaimResolutionTimeAmPm ?? "")?.[1];
  if (weekdays.length === 0 || meridiem === undefined || !within(hour, 1, 12) || !within(minute, 0, 59)) return null;

  return { weekdays, hour: hourOfDay(String(hour), meridiem), minute, timeZone: FANTRAX_TIMEZONE };
}

/** A whole number from `low` to `high`. */
function within(value: number | undefined, low: number, high: number): value is number {
  return value !== undefined && Number.isInteger(value) && value >= low && value <= high;
}
