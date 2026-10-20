import { LEAGUE_NAME, SEASON, londonDate, londonDayAndTime } from "@epl/core";
import { PAPER_NAME } from "../../config";
import { STANDING_CAPS } from "./heads";

// The masthead: a rule, the league as publisher in small capitals, the paper's title, and a fenced dateline.

export default function Masthead({
  /** The snapshot's instant, not the reader's clock, so one cached edition carries one date; null when undated. */
  at,
  lock,
}: {
  at: string | null;
  /** The next line-up lock and the gameweek it opens, where the calendar names one; null prints the season. */
  lock: { gameweek: number | undefined; at: string } | null;
}) {
  return (
    <header className="flex flex-col">
      {/* The rule a paper opens on, in ink like every rule on the sheet. */}
      <div className="h-[3px] bg-current" />

      <p className="pt-2 text-center font-sans text-3xs font-semibold uppercase tracking-[0.22em] text-muted">
        {LEAGUE_NAME}
      </p>

      {/* Allowed to wrap rather than shrink. */}
      <h1 className="paper-masthead text-balance pt-0.5 text-center">{PAPER_NAME}</h1>

      {/* The dateline, fenced: date at the left (an empty span holds the place when undated), the next lock at the right. */}
      <div className={`${STANDING_CAPS} mt-2 flex items-baseline justify-between gap-3 border-y-2 py-1`} style={{ borderColor: "currentColor" }}>
        <span>{at === null ? null : londonDate(at)}</span>
        <span className="numeric whitespace-nowrap">
          {lock === null ? (
            SEASON
          ) : (
            <>
              {lock.gameweek === undefined ? null : <span className="max-[374px]:hidden">GW{lock.gameweek} </span>}
              Locks {londonDayAndTime(lock.at)}
            </>
          )}
        </span>
      </div>
    </header>
  );
}
