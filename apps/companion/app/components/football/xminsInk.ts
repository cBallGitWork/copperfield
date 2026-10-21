import { START_DOUBT_MINUTES } from "../../config";

/** xMins in the loss red under the planner's floor, a doubt; the derived cyan otherwise, a dash included. */
export function minutesInk(minutes: number | null): string {
  return minutes !== null && minutes < START_DOUBT_MINUTES ? "text-bad" : "text-info";
}
