import type { Metadata } from "next";
import type { ReactNode } from "react";
import { rulesCard, scoredSlots } from "@epl/core";
import Nothing from "../components/shell/Nothing";
import { HeadRow, NameHead, PlateHead } from "../components/league/TableHeads";
import { leagueScoring } from "@/app/scoring";
import { backToFront, leaguePositionLabel } from "../positions";
import PageHeader from "../components/shell/PageHeader";
import ReadViews from "../components/shell/ReadViews";
import { SCORING_TITLE } from "../titles";
import { BOARD, FIGURE, PANEL_FLUSH, ROW_NAME, ROW_RULE } from "@/app/desk";

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
                <td key={slots[at]} colSpan={line.same ? slots.length : 1} className={`${FIGURE} text-ink`}>
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

/** More's strip over the page's own bar, as Credits and More wear it. */
function Frame({ children }: { children: ReactNode }) {
  return (
    <>
      <ReadViews current="more" />
      <PageHeader title={SCORING_TITLE} competition />
      <section className={PANEL_FLUSH}>{children}</section>
    </>
  );
}
