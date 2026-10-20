import type { Fixture } from "@epl/core";

// A match's state beside its score, as the Live tab sets it: the minute while it runs, FT after, nothing before.

const CLOCK = "text-sm font-bold uppercase lg:text-base";

export default function MatchClock({ fixture }: { fixture: Pick<Fixture, "status" | "minutes"> }) {
  if (fixture.status === "live") return <span className={`${CLOCK} numeric text-live`}>{fixture.minutes}&prime;</span>;
  if (fixture.status === "finished") return <span className={`${CLOCK} text-faint`}>FT</span>;
  return null;
}
