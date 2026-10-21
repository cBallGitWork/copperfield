// The pitch every intel file measures on: SofaScore's 0–100 on both axes.

/** Whether a coordinate is on the pitch the file says it is on; anything else is a mark that would look real. */
export function onPitch(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 100;
}
