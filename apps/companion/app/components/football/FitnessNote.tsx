"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { type FootballPlayer, fitnessNote, fitnessNoteText } from "@epl/core";
import { QUIET_NOTE } from "../../desk";

/** What the note needs of a man: small enough to cross into a client row. */
export type NotedPlayer = Pick<FootballPlayer, "code" | "status" | "news" | "chanceOfPlaying">;

const Weeks = createContext<ReadonlyMap<number, { expectedReturnGw: number }>>(new Map());

/** The squads export's return weeks for every row below it, given once by the root layout (`intelReturnWeeks`). */
export function ReturnWeeks({ weeks, children }: { weeks: Record<number, number>; children?: ReactNode }) {
  const held = useMemo(
    () => new Map(Object.entries(weeks).map(([code, week]) => [Number(code), { expectedReturnGw: week }])),
    [weeks],
  );
  return <Weeks.Provider value={held}>{children}</Weeks.Provider>;
}

/** An unfit man's complaint and return after his mark, "Knee · GW10"; it truncates before his name does. */
export default function FitnessNote({ player }: { player: NotedPlayer | null }) {
  const note = fitnessNote(player, useContext(Weeks));
  return note === null ? null : (
    <span className={`min-w-0 shrink-[99] truncate leading-tight ${QUIET_NOTE}`}>{fitnessNoteText(note)}</span>
  );
}
