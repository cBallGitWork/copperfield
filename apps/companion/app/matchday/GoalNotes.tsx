import type { MatchEventKind } from "@epl/core";
import type { FixtureGoals, GoalNote } from "./fixtureGoals";

// Who scored and who made it, under a Scores row: home down the left, away down the right, yours in the accent.

/** The word after a minute: a penalty or an own goal, as a results page prints it; nothing for a goal from play. */
const MARK: Partial<Record<MatchEventKind, string>> = { "penalty-goal": "pen", "own-goal": "og" };

export default function GoalNotes({ goals }: { goals: FixtureGoals }) {
  // The block widths of the row above, so each side's goals start under its own name.
  return (
    <div className="grid grid-cols-2 gap-x-4 px-8 pb-1.5 text-xs lg:px-9 lg:text-sm">
      <Side notes={goals.home} />
      <Side notes={goals.away} end />
    </div>
  );
}

function Side({ notes, end }: { notes: readonly GoalNote[]; end?: boolean }) {
  return (
    <ul className={`flex min-w-0 flex-col ${end === true ? "items-end text-right" : ""}`}>
      {notes.map((note) => (
        <li key={note.key}>
          <span className={note.scorerMine ? "text-accent" : "text-ink"}>{note.scorer}</span>{" "}
          <span className="numeric text-muted">
            {note.minute}&prime;{MARK[note.kind] === undefined ? null : ` ${MARK[note.kind]}`}
          </span>
          {note.assister === null ? null : (
            <>
              {" "}
              <span className="text-2xs font-bold uppercase text-muted">As</span>{" "}
              <span className={note.assisterMine ? "text-accent" : "text-ink"}>{note.assister}</span>
            </>
          )}
        </li>
      ))}
    </ul>
  );
}
