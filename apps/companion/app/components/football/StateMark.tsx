import { type Availability, doubtBand, noteBesideChance } from "@epl/core";
import { DOUBT_FILL } from "./doubtRow";

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
  const { state, label, chance } = availability;

  const shape =
    state === "suspended" ? (
      <rect x="4" y="2" width="8" height="12" rx="1" fill="currentColor" />
    ) : state === "unavailable" ? (
      <>
        <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="M4 12L12 4" stroke="currentColor" strokeWidth="2" />
      </>
    ) : (
      <path d="M6 2h4v4h4v4h-4v4H6v-4H2V6h4z" fill="currentColor" />
    );
  // The word the mark stands in for, and the chance and news a box used to carry in its title.
  const detail = [label, chance === null ? null : `${chance}% chance of playing`, noteBesideChance(availability.news, chance) || null]
    .filter(Boolean)
    .join(" · ");

  // Inline, so a greyed row's `.cm-out *` cannot take the band's colour off it.
  return (
    <svg
      {...(worded ? { "aria-hidden": true } : { role: "img", "aria-label": label })}
      viewBox="0 0 16 16"
      className="h-4 w-4 shrink-0"
      style={{ color: DOUBT_FILL[band] }}
    >
      {worded ? null : <title>{detail}</title>}
      {shape}
    </svg>
  );
}
