"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { type FootballPlayer, type GameweekStarts, fitnessNote } from "@epl/core";
import { QUIET_NOTE } from "../../desk";

/** What the note needs of a man: small enough to cross into a client row. */
export type NotedPlayer = Pick<FootballPlayer, "code" | "status" | "news" | "chanceOfPlaying">;

interface Held {
  weeks: ReadonlyMap<number, { expectedReturnGw: number }>;
  /** The gameweek whose lineups are being picked; a week at or before it is no return. Null when FPL is silent. */
  open: number | null;
  /** Each gameweek's first kickoff date, so FPL's "back 1 Nov" reads as the gameweek it opens. */
  starts: GameweekStarts;
}

const Weeks = createContext<Held>({ weeks: new Map(), open: null, starts: [] });

/** The squads export's return weeks, the open gameweek and the gameweeks' starts for every row below, given once by the
 *  root layout. */
export function ReturnWeeks({
  weeks,
  open,
  starts,
  children,
}: {
  weeks: Record<number, number>;
  open: number | null;
  starts: GameweekStarts;
  children?: ReactNode;
}) {
  const held = useMemo(
    () => ({ weeks: new Map(Object.entries(weeks).map(([code, week]) => [Number(code), { expectedReturnGw: week }])), open, starts }),
    [weeks, open, starts],
  );
  return <Weeks.Provider value={held}>{children}</Weeks.Provider>;
}

/** An unfit man's complaint and return after his mark, "Knee · GW10", the return in figures; it gives way before his
 *  name. `className` lets a row wrap it to a line of its own instead. */
export default function FitnessNote({ player, className = "shrink-[99]" }: { player: NotedPlayer | null; className?: string }) {
  const { weeks, open, starts } = useContext(Weeks);
  const note = fitnessNote(player, weeks, { open, starts });
  return note === null ? null : (
    <span className={`min-w-0 truncate leading-tight ${QUIET_NOTE} ${className}`}>
      {note.back === null ? (
        note.word
      ) : (
        <>
          {`${note.word} · `}
          <span className="numeric">{note.back}</span>
        </>
      )}
    </span>
  );
}
