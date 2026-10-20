import { type ExpectedMinutes, DASH } from "@epl/core";
import { QUIET_FIGURE } from "@/app/desk";
import CardBlock from "./CardBlock";

// A man's xMins over the coming gameweeks, on a player card: our model's figure, so it takes the derived reading's
// cyan, dated by the export it came from. Silent when the model knows nothing of him, as a card is for a fit man's news.

export default function MinutesRun({ weeks }: { weeks: readonly ExpectedMinutes[] }) {
  if (weeks.every((week) => week.minutes === null)) return null;
  const asOf = weeks.find((week) => week.asOf)?.asOf;
  return (
    <section className="cm-panel flex flex-col gap-1 px-3 py-2">
      <CardBlock label="xMins" aside={asOf} />
      <ol className="flex">
        {weeks.map((week) => (
          <li key={week.gameweek} className="flex flex-1 flex-col items-center">
            <span className={QUIET_FIGURE}>GW{week.gameweek}</span>
            <span className="numeric text-base font-bold text-info">{week.minutes ?? DASH}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
