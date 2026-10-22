import type { ReactNode } from "react";
import { DASH, venueMark } from "@epl/core";
import { GW_PLATE, MINOR_LABEL, QUIET_FIGURE, ROW_FIGURE } from "@/app/desk";
import CardBlock from "./CardBlock";
import { fdrStep } from "../football/fdr";
import { minutesInk } from "../football/xminsInk";
import type { FormMatch, NextMatch } from "../../players/[fantraxId]/cardWeeks";

// A card's should-I-play-him strip, FPL's sheet as two blocks of one run: his last matches on plain plates over our
// league's points (no FPL difficulty beside them, DESIGN §7), then the run to come on its difficulty over his xMins.

export default function WeekStrip({
  form,
  next,
  asOf,
  caption,
  captionAt = "form",
}: {
  /** Undefined while the read is out; null or empty when there is nothing to print. */
  form: readonly FormMatch[] | null | undefined;
  next: readonly NextMatch[];
  asOf: string | null;
  /** The row's own figure: "FPts 13". */
  caption?: ReactNode;
  /** League points sit over the form's league points; a projection or a gameweek's over the run to come. */
  captionAt?: "form" | "next";
}) {
  // With no run to head, the figure falls back to the Form head rather than vanish.
  const atNext = captionAt === "next" && next.length > 0;
  const minutesHead = asOf === null ? "xMins" : `xMins ${asOf}`;
  return (
    <>
      <section className={BLOCK}>
        <CardBlock label="Form" aside={atNext ? null : caption} />
        {form === undefined ? (
          <ol className="min-h-20" aria-busy />
        ) : form === null || form.length === 0 ? (
          <p className={QUIET_FIGURE}>{DASH}</p>
        ) : (
          <Run
            word="FPts"
            weeks={form.map((match) => ({
              key: String(match.fixtureId),
              gameweek: match.gameweek,
              against: match.opponent === null ? null : { shortName: match.opponent, home: match.home, difficulty: null },
              figure: match.points,
              ink: "text-info",
              title: `FPts, gameweek ${match.gameweek}`,
            }))}
          />
        )}
      </section>
      {next.length === 0 ? null : (
        <section className={BLOCK}>
          <CardBlock
            label="Next"
            aside={
              atNext && caption ? (
                <>
                  {caption} · {minutesHead}
                </>
              ) : (
                minutesHead
              )
            }
          />
          <Run
            word="xMins"
            weeks={next.map((match) => ({
              key: match.key,
              gameweek: match.gameweek,
              against: match.against,
              figure: match.minutes,
              ink: minutesInk(match.minutes ?? null),
              title: `Expected minutes, gameweek ${match.gameweek ?? DASH}`,
            }))}
          />
        </section>
      )}
    </>
  );
}

/** One of the card's blocks: a panel of its own, so the card's gap parts Form from Next. */
const BLOCK = "cm-panel flex flex-col gap-1 px-3 py-2";

interface Week {
  key: string;
  gameweek: number | null;
  against: { shortName: string; home: boolean; difficulty: number | null } | null;
  /** Undefined prints nothing: a double gameweek's second match shares the first's figure. */
  figure: number | null | undefined;
  ink: string;
  title: string;
}

/** A run of matches, the Profile's Next up in small: gameweek heads, the opponent on his plate, the figure under. */
function Run({ word, weeks }: { word: string; weeks: readonly Week[] }) {
  return (
    <ol className="flex items-stretch gap-1">
      {/* The figure row's word, in the lines' own heights, so the run is named on a phone. */}
      <li className="flex shrink-0 flex-col gap-1">
        <span className="h-6" aria-hidden />
        <span className="min-h-7" />
        <span className={`block ${ROW_FIGURE}`}>
          <span className={MINOR_LABEL}>{word}</span>
        </span>
      </li>
      {weeks.map((week) => {
        const step = fdrStep(week.against?.difficulty ?? null);
        return (
          <li key={week.key} className="flex min-w-0 flex-1 flex-col gap-1">
            <span className={GW_PLATE}>{week.gameweek === null ? DASH : `GW${week.gameweek}`}</span>
            <span
              className={`numeric flex min-h-7 items-baseline justify-center gap-px px-0.5 pt-1.5 text-xs font-bold leading-none ${step.ink}`}
              style={{ backgroundColor: step.ground }}
            >
              {week.against === null ? (
                DASH
              ) : (
                <>
                  <span className="truncate">{week.against.shortName}</span>
                  <span className="text-3xs font-normal opacity-80">{venueMark(week.against.home).replace(/[()]/g, "")}</span>
                </>
              )}
            </span>
            {week.figure === undefined ? null : (
              <span className={`numeric text-center font-bold ${ROW_FIGURE} ${week.ink}`} title={week.title}>
                {week.figure ?? DASH}
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}
