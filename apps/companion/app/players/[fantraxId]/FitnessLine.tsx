import type { Availability, DoubtBand, PlayerState } from "@epl/core";
import { doubtBand } from "@epl/core";
import StateBox from "../../components/football/StateBox";
import type { FootballPlayer } from "@epl/core";

// CM's injury line (Craig, 21 Oct 2026: "fitness needs more colour and CM like symbols"): his doubt band as the row's
// wash, CM's symbol in the loss red, the state box, FPL's words, and his chance as four quarter blocks.

/** The band's wash; the same three steps every list and pitch card reads. */
const WASH: Record<DoubtBand, string> = { out: "cm-doubt-out", major: "cm-doubt-major", slight: "cm-doubt-slight" };

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
    <div className={`flex items-center gap-2 px-2 py-1.5 ${WASH[band]}`}>
      <Symbol state={availability.state} />
      <StateBox player={player} />
      <p className="min-w-0 flex-1 text-sm leading-snug text-ink lg:text-base">{note}</p>
      {chance === null ? null : (
        <span className="flex shrink-0 items-center gap-1.5" title={`${chance}% chance of playing`}>
          <span aria-hidden className="flex gap-px">
            {QUARTERS.map((step) => (
              <span
                key={step}
                className="h-3 w-2 border border-line"
                style={chance >= step ? { backgroundColor: `var(--color-doubt-${band})` } : undefined}
              />
            ))}
          </span>
          <span className="numeric text-sm font-bold text-ink">{chance}%</span>
        </span>
      )}
    </div>
  );
}

/** CM's mark for why: the cross for a knock, the card for a ban, a bar through a man who has gone. Loss red, as ink. */
function Symbol({ state }: { state: PlayerState }) {
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
  return (
    <svg aria-hidden viewBox="0 0 16 16" className="h-4 w-4 shrink-0 text-bad">
      {shape}
    </svg>
  );
}
