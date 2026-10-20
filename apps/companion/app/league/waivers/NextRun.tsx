"use client";

import { londonDayAndTime, londonMoment, nextRun, timeLeft } from "@epl/core";
import { LABEL } from "../../desk";
import { runsAfter } from "./banner";
import { useMinute } from "./useMinute";

// Draft › Waivers' head: when claims next run, counting down, and the runs after it. Moves on by itself once a run
// has gone, so a page left open never counts down to the past.

export default function NextRun({ runs, now }: { runs: readonly string[]; now: string }) {
  const at = useMinute(now);
  const next = nextRun(runs, at);
  if (next === null) return <p className="text-sm text-muted">No run to come</p>;
  const after = runsAfter(runs, next.at);
  return (
    <div className="flex flex-col gap-1">
      <span className={LABEL}>Next run</span>
      <p className="flex flex-wrap items-baseline gap-x-2 font-chrome text-lg font-bold">
        <span>{londonMoment(next.at)}</span>
        <span className="numeric text-accent">in {timeLeft(next.left)}</span>
      </p>
      {after.length === 0 ? null : <p className="text-sm text-muted">Then {after.map(londonDayAndTime).join(" · ")}</p>}
    </div>
  );
}
