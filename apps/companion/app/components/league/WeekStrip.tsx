import type { ReactNode } from "react";
import { DASH, venueMark } from "@epl/core";
import { QUIET_FIGURE } from "@/app/desk";
import CardBlock from "./CardBlock";
import { fdrStep } from "../football/fdr";
import { minutesInk } from "../football/xminsInk";
import type { FormMatch, NextMatch } from "../../players/[fantraxId]/cardWeeks";

// A card's should-I-play-him strip, FPL's sheet in two rows: his last matches over our league's points, then the run
// to come on its difficulty over his xMins.

export default function WeekStrip({
  form,
  next,
  asOf,
  caption,
}: {
  /** Undefined while the read is out; null or empty when there is nothing to print. */
  form: readonly FormMatch[] | null | undefined;
  next: readonly NextMatch[];
  asOf: string | null;
  /** The row's own figure beside the Form head: "FPts 13". */
  caption?: ReactNode;
}) {
  return (
    <section className="cm-panel flex flex-col gap-1 px-3 py-2">
      <CardBlock label="Form" aside={caption} />
      <ol className="flex min-h-16 gap-1" aria-busy={form === undefined || undefined}>
        {form === undefined ? null : form === null || form.length === 0 ? (
          <li className={`${QUIET_FIGURE} self-center`}>{DASH}</li>
        ) : (
          form.map((match) => (
            <Week
              key={match.fixtureId}
              gameweek={match.gameweek}
              plate={match.opponent === null ? null : { shortName: match.opponent, home: match.home }}
              step={fdrStep(null)}
              figure={match.points}
              ink="text-info"
              title={`FPts, gameweek ${match.gameweek}`}
            />
          ))
        )}
      </ol>
      {next.length === 0 ? null : (
        <>
          <CardBlock label="Next" aside={asOf === null ? "xMins" : `xMins ${asOf}`} />
          <ol className="flex min-h-16 gap-1">
            {next.map((match) => (
              <Week
                key={match.key}
                gameweek={match.gameweek}
                plate={match.against}
                step={fdrStep(match.against?.difficulty ?? null)}
                figure={match.minutes}
                ink={minutesInk(match.minutes ?? null)}
                title={`Expected minutes, gameweek ${match.gameweek ?? DASH}`}
              />
            ))}
          </ol>
        </>
      )}
    </section>
  );
}

/** One match: its gameweek, the opponent on a plate in the step's colours, and the figure under it. */
function Week({
  gameweek,
  plate,
  step,
  figure,
  ink,
  title,
}: {
  gameweek: number | null;
  plate: { shortName: string; home: boolean } | null;
  step: { ground: string; ink: string };
  /** Undefined prints nothing: a double gameweek's second match shares the first's figure. */
  figure: number | null | undefined;
  ink: string;
  title: string;
}) {
  return (
    <li className="flex min-w-0 flex-1 flex-col items-center gap-1">
      <span className={QUIET_FIGURE}>{gameweek === null ? DASH : `GW${gameweek}`}</span>
      <span
        className={`numeric flex min-h-7 w-full items-baseline justify-center gap-px px-0.5 pt-1.5 text-xs font-bold leading-none ${step.ink}`}
        style={{ backgroundColor: step.ground }}
      >
        {plate === null ? (
          DASH
        ) : (
          <>
            <span className="truncate">{plate.shortName}</span>
            <span className="text-3xs font-normal opacity-80">{venueMark(plate.home).replace(/[()]/g, "")}</span>
          </>
        )}
      </span>
      {figure === undefined ? null : (
        <span className={`numeric text-base font-bold leading-none ${ink}`} title={title}>
          {figure ?? DASH}
        </span>
      )}
    </li>
  );
}
