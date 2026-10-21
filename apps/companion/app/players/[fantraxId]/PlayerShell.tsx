import type { ReactNode } from "react";
import { clubColoursOf, spelt } from "@epl/core";
import PlateShell from "../../components/shell/PlateShell";
import { POOL } from "../routes";
import PlayerTabs from "./PlayerTabs";
import type { PlayerTab } from "./PlayerTabs";
import { bracket } from "./bracket";
import type { Subject } from "./subject";

// The frame every player screen wears: CM's plated bar in his club's colours (`cm9900/11.jpg`), grey for a man FPL
// has never listed, over his tabs.

export default function PlayerShell({
  subject,
  fantraxId,
  current,
  children,
}: {
  /** Who the screen is about, whole, so every view reads him one way. */
  subject: Subject;
  fantraxId: string;
  current: PlayerTab;
  children: ReactNode;
}) {
  const { intel, football } = subject;
  const club = football?.club;
  return (
    <PlateShell
      colours={clubColoursOf(club)}
      title={heading((football ? spelt(intel.name, football.player) : intel.name) || fantraxId, bracket(subject))}
      back={POOL}
      tabs={<PlayerTabs fantraxId={fantraxId} current={current} empty={hollow(subject)} />}
    >
      {children}
    </PlateShell>
  );
}

/** `Pascal Groß (Atletico)`, in the spelling every list prints: the fantasy side in CM's brackets, no shirt number (Craig, 4 Sep 2026);
 *  a free man's status in them instead (`(FA)`, Craig, 21 Oct 2026: "that goes in player row title at top"). */
function heading(name: string, held: string | null): string {
  return held === null ? name : `${name} (${held})`;
}

/** The views with nothing behind them for this man, decided from him rather than from the tab you
 *  are on: a man the bridge has never settled has no Premier League record, which is all of Data. */
function hollow({ football }: Subject): readonly PlayerTab[] {
  return football === null ? ["data"] : [];
}
