import { doubtBand, type FootballPlayer } from "@epl/core";
import StateBox from "../../components/football/StateBox";
import StateMark from "../../components/football/StateMark";
import { DOUBT_FILL, fitnessOf } from "../../components/football/doubtRow";
import { fitnessNote } from "./condition";

// CM's injury line (Craig, 21 Oct 2026: "fitness needs more colour and CM like symbols"): his doubt band as the row's
// wash, CM's mark filled in the same band, the state box, FPL's words, and his chance as four quarter blocks.

/** FPL's chance comes in quarters (0, 25, 50, 75, 100), so four blocks hold every reading. */
const QUARTERS = [25, 50, 75, 100] as const;

export default function FitnessLine({
  player,
  boxed = true,
}: {
  player: FootballPlayer;
  /** The state box beside the mark: the Profile's line keeps it, a player card's does not (DESIGN §3). */
  boxed?: boolean;
}) {
  const { wash, mark } = fitnessOf(player);
  const band = mark === null ? null : doubtBand(mark);
  if (mark === null || band === null) return null;
  const chance = mark.chance;

  return (
    <div className={`flex items-center gap-2 px-2 py-1.5 ${wash}`}>
      <StateMark availability={mark} worded={boxed} />
      {boxed ? <StateBox player={player} /> : null}
      <p className="min-w-0 flex-1 text-sm leading-snug text-ink lg:text-base">{fitnessNote(mark)}</p>
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
