import type { Metadata } from "next";
import type { ReactNode } from "react";
import { CUP_TIE_STEPS, rulesCard, scoredSlots } from "@epl/core";
import Nothing from "../components/shell/Nothing";
import { HeadRow, NameHead, PlateHead } from "../components/league/TableHeads";
import { leagueScoring } from "@/app/scoring";
import { backToFront, leaguePositionLabel } from "../positions";
import PageHeader from "../components/shell/PageHeader";
import { MORE } from "../components/shell/sections";
import { SCORING_TITLE } from "../titles";
import { BOARD, FIGURE, LABEL, PANEL, ROW_NAME, ROW_RULE } from "@/app/desk";

// What every category pays each roster slot, read from getLeagueInfo: a line once where every slot is paid alike.
// Listed on More since 13 Oct 2026, not a Draft tab: reference read once, not weekly.

export const metadata: Metadata = { title: SCORING_TITLE };

export const revalidate = 30;

export default async function ScoringPage() {
  const scoring = await leagueScoring();
  if (scoring === null) {
    return (
      <Frame>
        <Nothing title="No scoring yet" code="getLeagueInfo → no scoring" />
      </Frame>
    );
  }

  const slots = backToFront(scoredSlots(scoring.rules));
  const lines = rulesCard(scoring, slots);

  return (
    <Frame>
      <table className={BOARD}>
        <caption className="sr-only">Fantasy points for each category, by the slot a manager plays a man in</caption>
        <thead>
          <HeadRow>
            <NameHead label="Category" />
            {slots.map((slot) => (
              <PlateHead key={slot} at="centre" className="w-16 lg:w-32">
                {leaguePositionLabel(slot)}
              </PlateHead>
            ))}
          </HeadRow>
        </thead>
        <tbody>
          {lines.map((line) => (
            <tr key={line.name} className={ROW_RULE}>
              <td className="pl-2" title={line.key}>
                <span className={`cm-row flex min-h-11 items-center ${ROW_NAME}`}>{line.name}</span>
              </td>
              {(line.same ? line.prices.slice(0, 1) : line.prices).map((cell, at) => (
                // Below 375 the four slots' padding would push the board through the panel's right inset.
                <td key={slots[at]} colSpan={line.same ? slots.length : 1} className={`${FIGURE} text-ink max-[374px]:px-0.5`}>
                  {cell.map((band) => (
                    <span key={band} className="block whitespace-nowrap">
                      {band}
                    </span>
                  ))}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </Frame>
  );
}

/** The page's bar with a way back to More, as Credits and FPL, then the cups' tie-break. */
function Frame({ children }: { children: ReactNode }) {
  return (
    <>
      <PageHeader title={SCORING_TITLE} competition back={MORE} />
      <section className={PANEL}>{children}</section>
      <CupTies />
    </>
  );
}

/** How a level cup tie is settled, in the order the decider walks (Craig, 19 Oct 2026). */
function CupTies() {
  return (
    <section aria-labelledby="scoring-cup-ties" className={PANEL}>
      <h2 id="scoring-cup-ties" className={LABEL}>
        Cup ties
      </h2>
      <p className="text-sm">One leg: the higher score goes through. Level on points, it is settled by, in turn:</p>
      <ol className="list-decimal pl-5 text-sm">
        {CUP_TIE_STEPS.map((each) => (
          <li key={each.step}>{each.rule}</li>
        ))}
      </ol>
      <p className="text-sm">
        Only each side&apos;s eleven counts, after any substitute comes on. The tie says which one settled it, and the
        coin falls the same way for everyone.
      </p>
    </section>
  );
}
