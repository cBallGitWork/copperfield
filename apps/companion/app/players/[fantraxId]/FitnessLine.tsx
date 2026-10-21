import type { Availability } from "@epl/core";
import { doubtBand } from "@epl/core";
import StateBox from "../../components/football/StateBox";
import StateMark from "../../components/football/StateMark";
import { DOUBT_FILL, doubtWash } from "../../components/football/doubtRow";
import type { FootballPlayer } from "@epl/core";

// CM's injury line (Craig, 21 Oct 2026: "fitness needs more colour and CM like symbols"): his doubt band as the row's
// wash, CM's mark filled in the same band, the state box, FPL's words, and his chance as four quarter blocks.

/** FPL's chance comes in quarters (0, 25, 50, 75, 100), so four blocks hold every reading. */
const QUARTERS = [25, 50, 75, 100] as const;

export default function FitnessLine({
  player,
  availability,
  note,
}: {
  player: FootballPlayer;
  availability: Availability;
  /** `fitnessNote`'s line, his chance already left out of it. */
  note: string;
}) {
  const band = doubtBand(availability);
  if (band === null) return null;
  const chance = availability.chance;

  return (
    <div className={`flex items-center gap-2 px-2 py-1.5 ${doubtWash(band)}`}>
      <StateMark availability={availability} worded />
      <StateBox player={player} />
      <p className="min-w-0 flex-1 text-sm leading-snug text-ink lg:text-base">{note}</p>
      {chance === null ? null : (
        <span className="flex shrink-0 items-center gap-1.5" title={`${chance}% chance of playing`}>
          <span aria-hidden className="flex gap-px">
            {QUARTERS.map((step) => (
              <span
                key={step}
                className="h-3 w-2 border border-line"
                style={chance >= step ? { backgroundColor: DOUBT_FILL[band] } : undefined}
              />
            ))}
          </span>
          <span className="numeric text-sm font-bold text-ink">{chance}%</span>
        </span>
      )}
    </div>
  );
}
