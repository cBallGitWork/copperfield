import { type Availability, type PlayerState, doubtBand, noteBesideChance } from "@epl/core";
import { DOUBT_FILL } from "./doubtRow";

/** The word in full, where the box abbreviates it: a screen reader says "Doubtful", not "D-B-T". */
const WORD: Record<Exclude<PlayerState, "fit">, string> = {
  doubt: "Doubtful",
  injured: "Injured",
  suspended: "Suspended",
  unavailable: "Unavailable",
};

// CM's mark for why he may miss, filled in his doubt band so it matches the row's wash (Craig, 21 Oct 2026): the
// cross for a knock, the card for a ban, a bar through a man who has gone. Silent for a fit man.

export default function StateMark({
  availability,
  worded = false,
}: {
  availability: Availability;
  /** `StateBox` prints the word beside it, so a screen reader is not told twice. */
  worded?: boolean;
}) {
  const band = doubtBand(availability);
  if (band === null) return null;
  const { state, chance } = availability;
  const word = state === "fit" ? "" : WORD[state];

  // Each shape paints from the band itself: `.cm-out *` greys `color`, so a `currentColor` fill would follow it (D-5).
  const ink = DOUBT_FILL[band];
  const shape =
    state === "suspended" ? (
      <rect x="4" y="2" width="8" height="12" rx="1" style={{ fill: ink }} />
    ) : state === "unavailable" ? (
      <>
        <circle cx="8" cy="8" r="6" fill="none" strokeWidth="2" style={{ stroke: ink }} />
        <path d="M4 12L12 4" strokeWidth="2" style={{ stroke: ink }} />
      </>
    ) : (
      <path d="M6 2h4v4h4v4h-4v4H6v-4H2V6h4z" style={{ fill: ink }} />
    );
  // The word the mark stands in for, and the chance and news a box used to carry in its title.
  const detail = [word, chance === null ? null : `${chance}% chance of playing`, noteBesideChance(availability.news, chance) || null]
    .filter(Boolean)
    .join(" · ");

  return (
    <svg
      {...(worded ? { "aria-hidden": true } : { role: "img", "aria-label": word })}
      viewBox="0 0 16 16"
      className="h-[1em] w-[1em] shrink-0"
    >
      {worded ? null : <title>{detail}</title>}
      {shape}
    </svg>
  );
}
