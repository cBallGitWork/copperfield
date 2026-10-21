"use client";

import { useState } from "react";
import type { SquadDetailLine, SquadPlayerDetail, SquadReason } from "@epl/core";
import PlayerCard from "./PlayerCard";
import SquadRows from "./SquadRows";
import { PANEL_FLUSH } from "@/app/desk";

// A squad with no gameweek to report: all fifteen as a list, no pitch, since the gate withholds the shape.
// It arrives joined on the server (`squadDetail`); the client boundary is here for the list and card's one selection.

/** The reasons a lineup is withheld because a read failed; `not-locked` is the ordinary state and says nothing. */
const UNREAD: ReadonlySet<SquadReason> = new Set(["unknown-period", "no-calendar", "period-not-in-calendar", "unknown-lock"]);

export default function SquadBoard({
  lines,
  because,
  projected,
  eligibility,
}: {
  lines: SquadDetailLine[];
  because: SquadReason;
  /** Whether the points are Fantrax's projection, not a season played; the list then heads its column "Proj". */
  projected: boolean;
  /** Eligible positions by Fantrax id; a record, not a `Map`, as it crosses to the browser. */
  eligibility?: Record<string, string[]>;
}) {
  const [open, setOpen] = useState<SquadPlayerDetail | null>(null);

  return (
    <div className="flex flex-col gap-2">
      {UNREAD.has(because) ? (
        <p className="border border-line bg-surface px-3 py-2 text-2xs text-muted" data-code={because}>
          Line-up not available right now.
        </p>
      ) : null}

      <section className={PANEL_FLUSH}>
        <SquadRows lines={lines} figure={projected ? "projected" : "season"} onOpen={setOpen} eligibility={eligibility} />
      </section>

      {open ? (
        <PlayerCard
          // Remounts per player, so the dialog opens clean with no effect keeping `showModal` in step.
          key={open.rostered.slot.fantraxId}
          player={open}
          eligible={eligibility?.[open.rostered.slot.fantraxId]}
          figure={projected ? "projected" : "season"}
          onClose={() => setOpen(null)}
        />
      ) : null}
    </div>
  );
}
