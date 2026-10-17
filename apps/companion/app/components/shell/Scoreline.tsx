import type { ReactNode } from "react";

/** The one character between a score's two figures on the desk: CM's colon, `1:3`, never `1-3` (`docs/ui/reference`). */
export const SCORE_RULE = ":";

/** Two figures and the rule between them; `rule` is the rule's own class, its quiet and its spacing. */
export default function Scoreline({ home, away, rule }: { home: ReactNode; away: ReactNode; rule?: string }) {
  return (
    <>
      {home}
      <span aria-hidden className={rule}>
        {SCORE_RULE}
      </span>
      {away}
    </>
  );
}
