import { DASH, type ScoredFixture, type ScoredStage } from "@epl/core";
import { BLOCK_PLATE, LABEL, QUIET_FIGURE, ROW_NAME } from "@/app/desk";
import ScrollBoard from "../../components/league/ScrollBoard";

/** One side of a draw as columns of ties, first round on the left; a phone scrolls it sideways a round at a time,
 *  with the board's fade and gauge saying there is more. */
export default function Bracket({ title, stages }: { title: string; stages: readonly ScoredStage[] }) {
  if (stages.length === 0) return null;
  return (
    <section className="flex flex-col gap-1">
      <h2 className={BLOCK_PLATE}>{title}</h2>
      <ScrollBoard className="snap-x snap-mandatory scroll-px-1">
        <ol className="flex min-w-max gap-3 p-1">
          {stages.map((stage) => (
            <li key={`${stage.gameweek}-${stage.name}`} className="flex w-36 snap-start flex-col gap-2 lg:w-44">
              <p className={`${LABEL} flex justify-between gap-2`}>
                <span className="truncate">{stage.name}</span>
                <span className="numeric shrink-0">GW{stage.gameweek}</span>
              </p>
              {/* Spread down the column, so a later round's tie sits level with the two it follows. */}
              <ul className="flex flex-1 flex-col justify-around gap-2">
                {stage.fixtures.map((fixture) => (
                  <li key={fixture.code ?? `${fixture.home}-${fixture.away}`} className="cm-panel flex flex-col px-2 py-1">
                    <span className={QUIET_FIGURE}>{fixture.code}</span>
                    <Side fixture={fixture} at="home" />
                    <Side fixture={fixture} at="away" />
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </ScrollBoard>
    </section>
  );
}

/** One side of a tie: the team, its score in the reading cyan once the gameweek starts, and the loser greyed once it
 *  is decided, as CM greys a man out. A level tie at full time keeps both in ink until its tie-break is read. */
function Side({ fixture, at }: { fixture: ScoredFixture; at: "home" | "away" }) {
  const score = fixture.score;
  const out = score?.through !== undefined && score.through !== at;
  return (
    <span className={`flex items-baseline justify-between gap-2 ${out ? "text-muted" : ""}`}>
      <span className={`${ROW_NAME} truncate ${score?.through === at ? "text-ink" : ""}`}>
        {fixture[at]}
        {/* Level on points and through on the tie-break: the word stays for a screen reader, the mark for the eye. */}
        {score?.tieBreak && score.through === at ? <span title="Through on the tie-break" className="pl-1 text-2xs text-muted">(tb)</span> : null}
      </span>
      {score === undefined ? null : (
        <span className={`numeric shrink-0 text-sm font-bold ${out ? "text-muted" : "text-info"}`}>{score[at] ?? DASH}</span>
      )}
    </span>
  );
}
