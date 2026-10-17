import type { Pedigree } from "@epl/core";
import { DASH, ordinal, signed } from "@epl/core";
import { MINOR_LABEL } from "@/app/desk";

// What the draft paid for him, in Transfer's status panel: the pick, who made it, and how he has ranked since.

/** `11th pick, by Raccoons`: the pick is overall, the round never printed; a drafter nobody can name is left off. */
export function draftPick(pedigree: Extract<Pedigree, { origin: "draft" }>, drafterName: string | null): string {
  const pick = `${ordinal(pedigree.overall)} pick`;
  return drafterName === null ? pick : `${pick}, by ${drafterName}`;
}

/** Picks better than he cost, signed: red below, green above, a dash where he has no ranking. */
export function Value({ against }: { against: number | null }) {
  if (against === null)
    return <span className="numeric text-sm text-faint">{DASH}</span>;

  return (
    <span
      title={
        against === 0
          ? "Ranked where he was picked"
          : `Ranked ${Math.abs(against)} ${Math.abs(against) === 1 ? "place" : "places"} ${against < 0 ? "below" : "above"} his pick`
      }
      className={`flex items-baseline gap-1 ${MINOR_LABEL}`}
    >
      <span
        className={`numeric text-sm ${
          against < 0 ? "text-bad" : against > 0 ? "text-up" : "text-ink"
        }`}
      >
        {signed(against)}
      </span>
      on his pick
    </span>
  );
}
