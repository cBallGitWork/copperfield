import type { Opposition, PlannerView } from "@epl/core";
import Section from "../../components/shell/Section";
import { fixtureEase } from "../../components/football/fixtureEase";
import { DASH, venueMark } from "@epl/core";
import { GW_PLATE, MINOR_LABEL, ROW_FIGURE } from "@/app/desk";

// What is coming, as a run: each block on the planner's ease ramp for his side of the ball, under it his xMins.
// No source caption (Craig, 30 Sep 2026); each figure's title says whose it is.

export default function FixtureRun({
  run,
  minutes,
  asOf,
  view,
}: {
  run: Opposition[];
  /** His xMins by gameweek. */
  minutes: ReadonlyMap<number, number | null>;
  /** The London day the model's export was taken, printed once beside the heading. */
  asOf: string;
  /** Which planner board his fixtures read off (`easeView`). */
  view: PlannerView;
}) {
  // A club with nothing left has an empty run, and a heading over no blocks is a claim that something is missing.
  if (run.length === 0) return null;
  const flat = oneFigure(run, minutes);

  return (
    <Section title="Next up" aside={`xMins as of ${asOf}`}>
      <ol className="flex items-stretch gap-1">
        {/* Each row's word, in the lines' own heights, so the cyan run is named on a phone (review M30); a run of
            one figure prints it here, once (review D4). */}
        <li className="flex shrink-0 flex-col gap-1">
          <span className="h-6" aria-hidden />
          <span className="min-h-7" />
          <span className={`flex items-baseline gap-1 ${ROW_FIGURE}`}>
            <span className={MINOR_LABEL}>xMins</span>
            {flat === null ? null : (
              <span className="numeric font-bold text-info" title="Expected minutes, every gameweek in the run">
                {flat}
              </span>
            )}
          </span>
        </li>
        {run.map((against, at) => {
          const gw = against.fixture.gameweek;
          // A double gameweek's figure is the week's, so it sits under the week's first match only.
          const repeat = gw !== null && run.slice(0, at).some((earlier) => earlier.fixture.gameweek === gw);
          const step = fixtureEase(view, against.club.code, against.home);
          return (
            <li key={against.fixture.id} className="flex min-w-0 flex-1 flex-col gap-1">
              <span className={GW_PLATE}>
                {/* A rearranged match can lose its round; it keeps its place in the run and says so. */}
                {gw === null ? DASH : `GW${gw}`}
              </span>
              {/* One 28px line, the venue a step down beside the club (Craig, 21 Oct 2026: "next up can be smaller"). */}
              <span
                className={`numeric flex min-h-7 items-baseline justify-center gap-px px-0.5 pt-1.5 text-xs font-bold leading-none ${step.ink}`}
                style={{ backgroundColor: step.ground }}
              >
                <span className="truncate">{against.club.shortName}</span>
                <span className="text-3xs font-normal opacity-80">{venueMark(against.home).replace(/[()]/g, "")}</span>
              </span>
              {repeat || gw === null || flat !== null ? null : (
                <span className={`numeric text-center font-bold text-info ${ROW_FIGURE}`} title={`Expected minutes, gameweek ${gw}`}>
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

/** The one xMins every gameweek of the run shares, or null when the run moves or has a gap. */
export function oneFigure(run: readonly Opposition[], minutes: ReadonlyMap<number, number | null>): number | null {
  const figures = new Set(run.map((against) => (against.fixture.gameweek === null ? null : minutes.get(against.fixture.gameweek) ?? null)));
  const [only] = figures;
  return run.length > 1 && figures.size === 1 && only !== undefined && only !== null ? only : null;
}
