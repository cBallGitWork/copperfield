import type { RoundState } from "@epl/core";
import LiveMark from "../shell/LiveMark";

// Where the gameweek on screen stands, in one word; each caller sets its own size and weight.

export default function RoundWord({ state }: { state: RoundState }) {
  if (state === null) return null;

  if (state === "live") return <LiveMark className="gap-1.5 text-live" />;

  // "Final" promises the number has stopped moving, so it waits for FPL's own sign-off.
  // `bonus-settling` reads "Full time" like `provisional`: the totals are Fantrax's, whose scoring has no bonus.
  return <>{state === "final" ? "Final" : "Full time"}</>;
}
