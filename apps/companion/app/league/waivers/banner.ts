import { MS_PER_DAY } from "@epl/core";

/** The runs in the week after `next`, which a weekday alone names without a doubt: `Thu 18:00 · Fri 18:00`. */
export function runsAfter(runs: readonly string[], next: string): string[] {
  const from = Date.parse(next);
  return runs.filter((run) => {
    const gap = Date.parse(run) - from;
    return gap > 0 && gap < MS_PER_DAY * 7;
  });
}
