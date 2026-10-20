import type { Opposition } from "@epl/core";
import Section from "../../components/shell/Section";
import { fdrStep } from "../../components/football/fdr";
import { DASH, venueMark } from "@epl/core";
import { MINOR_LABEL, QUIET_FIGURE } from "@/app/desk";

// What is coming, as a run: FPL's difficulty on each block, under it the sister model's xMins for that gameweek.
// No source caption (Craig, 30 Sep 2026); each figure's title says whose it is.

export default function FixtureRun({
  run,
  minutes,
  asOf,
}: {
  run: Opposition[];
  /** His xMins by gameweek. */
  minutes: ReadonlyMap<number, number | null>;
  /** The London day the model's export was taken, printed once beside the heading. */
  asOf: string;
}) {
  // A club with nothing left has an empty run, and a heading over no blocks is a claim that something is missing.
  if (run.length === 0) return null;

  return (
    <Section title="Next up" aside={`xMins as of ${asOf}`}>
      <ol className="flex items-stretch gap-1">
        {/* Each row's word, in the lines' own heights, so the cyan run is named on a phone (review M30). */}
        <li className="flex shrink-0 flex-col gap-1">
          <span className={`${QUIET_FIGURE} invisible`} aria-hidden>
            GW
          </span>
          <span className="min-h-11" />
          <span className="block text-xs">
            <span className={MINOR_LABEL}>xMins</span>
          </span>
        </li>
        {run.map((against, at) => {
          const gw = against.fixture.gameweek;
          // A double gameweek's figure is the week's, so it sits under the week's first match only.
          const repeat = gw !== null && run.slice(0, at).some((earlier) => earlier.fixture.gameweek === gw);
          const step = fdrStep(against.difficulty);
          return (
            <li key={against.fixture.id} className="flex min-w-0 flex-1 flex-col gap-1">
              <span className={`${QUIET_FIGURE} text-center`}>
                {/* A rearranged match can lose its round; it keeps its place in the run and says so. */}
                {gw === null ? DASH : `GW${gw}`}
              </span>
              <span
                className={`numeric flex min-h-11 flex-col items-center justify-center px-1 text-xs font-bold leading-tight ${step.ink}`}
                style={{ backgroundColor: step.ground }}
              >
                <span className="truncate">{against.club.shortName}</span>
                <span className="text-2xs font-normal opacity-80">{venueMark(against.home)}</span>
              </span>
              {repeat || gw === null ? null : (
                <span className="numeric text-center text-xs font-bold text-info" title={`Expected minutes, gameweek ${gw}`}>
                  {minutes.get(gw) ?? DASH}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </Section>
  );
}

