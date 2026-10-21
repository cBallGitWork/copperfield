import { DASH } from "@epl/core";
import { minutesInk } from "../../../../components/football/xminsInk";

/** One gameweek's xMins by FPL code: a number, 0 included, or null for no reading. */
export interface WeekMinutes {
  gameweek: number;
  byCode: ReadonlyMap<number, number | null>;
}

/** A man's xMins pinned to the right of his name, inked by risk (`minutesInk`). */
export default function XMins({ code, minutes }: { code: number; minutes: WeekMinutes }) {
  const value = minutes.byCode.get(code) ?? null;
  return (
    <span className={`numeric ml-auto shrink-0 font-bold ${minutesInk(value)}`} title={`Expected minutes, gameweek ${minutes.gameweek}`}>
      {value ?? DASH}
    </span>
  );
}
