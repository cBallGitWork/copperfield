"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { type FootballPlayer, fitnessNote } from "@epl/core";
import { QUIET_NOTE } from "../../desk";

/** What the note needs of a man: small enough to cross into a client row. */
export type NotedPlayer = Pick<FootballPlayer, "code" | "status" | "news" | "chanceOfPlaying">;

interface Held {
  weeks: ReadonlyMap<number, { expectedReturnGw: number }>;
  /** The gameweek whose lineups are being picked; a week at or before it is no return. Null when FPL is silent. */
  open: number | null;
}

const Weeks = createContext<Held>({ weeks: new Map(), open: null });

/** The squads export's return weeks and the open gameweek for every row below, given once by the root layout. */
export function ReturnWeeks({ weeks, open, children }: { weeks: Record<number, number>; open: number | null; children?: ReactNode }) {
  const held = useMemo(
    () => ({ weeks: new Map(Object.entries(weeks).map(([code, week]) => [Number(code), { expectedReturnGw: week }])), open }),
    [weeks, open],
  );
  return <Weeks.Provider value={held}>{children}</Weeks.Provider>;
}

/** An unfit man's complaint and return after his mark, "Knee · GW10", the return in figures; it gives way before his
 *  name. `className` lets a row wrap it to a line of its own instead. */
export default function FitnessNote({ player, className = "shrink-[99]" }: { player: NotedPlayer | null; className?: string }) {
  const { weeks, open } = useContext(Weeks);
  const note = fitnessNote(player, weeks, open);
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
