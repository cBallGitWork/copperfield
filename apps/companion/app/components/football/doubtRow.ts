import { type Availability, type DoubtBand, type FootballPlayer, availabilityOf, doubtBand } from "@epl/core";

/** The wash across a row for how likely its man is to miss (DESIGN §3's doubt ramp). Class names
 *  written out, because Tailwind and `desk.css` read them literally. */
const WASH = { out: "cm-doubt-out", major: "cm-doubt-major", slight: "cm-doubt-slight" } as const;

/** A band's full colour, for a shape it fills (`StateMark`, the Profile's quarter blocks); written out for Tailwind. */
export const DOUBT_FILL: Record<DoubtBand, string> = {
  out: "var(--color-doubt-out)",
  major: "var(--color-doubt-major)",
  slight: "var(--color-doubt-slight)",
};

/** The wash for a band, or "" for none: for a row that holds a band rather than a footballer. */
export function doubtWash(band: DoubtBand | null): string {
  return band === null ? "" : WASH[band];
}

/** The row's wash, or "" for a fit man and one the bridge has not settled. */
export function doubtRow(player: FootballPlayer | null): string {
  return fitnessOf(player).wash;
}

/** A row's fitness, asked once: its wash and the availability `StateMark` draws, null for a fit or unsettled man. */
export function fitnessOf(player: FootballPlayer | null): { wash: string; mark: Availability | null } {
  const availability = availabilityOf(player);
  const band = doubtBand(availability);
  return { wash: doubtWash(band), mark: band === null ? null : availability };
}
