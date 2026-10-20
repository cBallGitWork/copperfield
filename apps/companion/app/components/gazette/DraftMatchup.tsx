import { benchText, lineupText, returnText, type Club, type StoryDraftMatchup, type StoryDraftReturn, type StoryDraftSide } from "@epl/core";
import { derbyBetween } from "@/app/derbies";
import Face from "./Face";
import LineupText from "./LineupText";
import { STANDING_HEAD as SMALL } from "./heads";
import { RULE } from "./rules";

// One match-up of a draft report, set as a newspaper match report is: the score with each side's goals under it, the
// assists and clean sheets; then the story, its own photograph set into the text, and the
// line-ups with the bench under each side, after the story on a phone and beside it on a desk.

/** A side's scorers under its name, one a line. */
function Goals({ goals, align }: { goals: StoryDraftReturn[]; align: "start" | "end" }) {
  return (
    <div className={`flex min-w-0 flex-col gap-1 text-xs leading-snug text-ink ${align === "end" ? "text-right" : "text-left"}`}>
      {goals.map((g) => (
        <span key={g.name}>{returnText(g)}</span>
      ))}
    </div>
  );
}

/** "Assists test2: Meunier · 123: Groß", leaving out a side with none. */
function Tally({ label, sides, of }: { label: string; sides: StoryDraftSide[]; of: (side: StoryDraftSide) => StoryDraftReturn[] }) {
  const parts = sides.filter((side) => of(side).length > 0).map((side) => `${side.name}: ${of(side).map(returnText).join(", ")}`);
  if (parts.length === 0) return null;
  return (
    <p className="text-2xs leading-snug text-muted">
      <span className={SMALL}>{label} </span>
      {parts.join(" · ")}
    </p>
  );
}

export default function DraftMatchup({ matchup, n, saturday, clubs }: { matchup: StoryDraftMatchup; n: number; saturday: boolean; clubs?: Map<number, Club> }) {
  const { home, away } = matchup;
  const derby = derbyBetween(home.teamId, away.teamId);
  return (
    <section id={`d-${n}`} className="flex scroll-mt-4 flex-col gap-3 py-5">
      <header className={`flex flex-col gap-2 border-y py-3 ${RULE}`}>
        <p className={SMALL}>
          {saturday ? "After Saturday" : "Full time"}
          {derby === null ? null : ` · ${derby.name}`}
        </p>
        <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-3">
          {/* A long name wraps in its own column rather than pushing a 320px page sideways. */}
          <span className="paper-display min-w-0 wrap-anywhere text-base leading-tight font-semibold text-ink sm:text-lg">{home.name}</span>
          <span className="numeric paper-display text-4xl leading-none font-semibold text-ink">
            {home.score}-{away.score}
          </span>
          <span className="paper-display min-w-0 wrap-anywhere text-right text-base leading-tight font-semibold text-ink sm:text-lg">{away.name}</span>
        </div>
        {home.returns.goals.length + away.returns.goals.length === 0 ? null : (
          <div className="grid grid-cols-2 gap-4">
            <Goals goals={home.returns.goals} align="start" />
            <Goals goals={away.returns.goals} align="end" />
          </div>
        )}
        <Tally label="Assists" sides={[home, away]} of={(side) => side.returns.assists} />
        <Tally label="Clean sheets" sides={[home, away]} of={(side) => side.returns.cleanSheets} />
      </header>
      <div className="grid gap-x-8 gap-y-5 @3xl:grid-cols-[1fr_18rem]">
        {/* flow-root keeps the floated photograph inside the story. */}
        <div className="flow-root min-w-0">
          {matchup.face === null || clubs === undefined ? null : (
            <figure className="float-left mt-1 mr-3 mb-2">
              <Face face={matchup.face} clubs={clubs} rank="tie" />
              <figcaption className={`${SMALL} pt-1`}>{matchup.face.name}</figcaption>
            </figure>
          )}
          {matchup.standfirst === "" ? null : <p className="text-lg leading-snug font-semibold text-ink">{matchup.standfirst}</p>}
          {matchup.paragraphs.map((p, i) => (
            <p key={i} className="pt-3 text-base leading-relaxed text-ink">
              {p}
            </p>
          ))}
        </div>
        <Lineups sides={[home, away]} />
      </div>
    </section>
  );
}

/** Both line-ups as a report prints them, each side's bench under its eleven. */
function Lineups({ sides }: { sides: StoryDraftSide[] }) {
  if (sides.every((s) => s.eleven.length === 0)) return null;
  return (
    <aside className={`flex flex-col gap-2 border-t pt-2 ${RULE}`}>
      <h3 className={SMALL}>Line-ups</h3>
      {sides.map((side) => (
        <LineupText key={side.teamId} team={side.name} notes={[{ label: "Bench", names: side.bench.length === 0 ? "" : benchText(side.bench) }]}>
          {lineupText(side.eleven)}
        </LineupText>
      ))}
    </aside>
  );
}
