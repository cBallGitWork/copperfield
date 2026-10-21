import { DASH } from "@epl/core";

/** One gameweek's xMins by FPL code: a number, 0 included, or null for no reading. */
export interface WeekMinutes {
  gameweek: number;
  byCode: ReadonlyMap<number, number | null>;
}

/** A man's xMins pinned to the right of his name, in the derived reading's cyan. */
export default function XMins({ code, minutes }: { code: number; minutes: WeekMinutes }) {
  return (
    <span className="numeric ml-auto shrink-0 font-bold text-info" title={`Expected minutes, gameweek ${minutes.gameweek}`}>
      {minutes.byCode.get(code) ?? DASH}
    </span>
  );
}
