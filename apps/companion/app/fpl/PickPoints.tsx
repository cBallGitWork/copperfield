"use client";

import { useState, type ReactNode } from "react";
import type { Club, FootballPlayer, FplPick, Opposition } from "@epl/core";
import { fplLineName, isFplKeeper, kickedOff, matchesOver } from "@epl/core";
import Breakdown from "../components/league/Breakdown";
import { FootballerIdentity } from "../components/league/PlayerIdentity";
import DialogFoot from "../components/shell/DialogFoot";
import DialogHead from "../components/shell/DialogHead";
import Modal from "../components/shell/Modal";
import { minutesOf, scoreRows } from "./scoreRows";

/** A pick on the FPL pitch as a button that opens the player card's frame over his FPL points, line by line. */
export default function PickPoints({
  pick,
  name,
  player,
  club,
  opposition,
  children,
}: {
  pick: FplPick;
  /** His name in full, for the card's title bar. */
  name: string;
  /** The footballer FPL names; null for a pick the snapshot does not hold. */
  player: FootballPlayer | null;
  club: Club | undefined;
  /** His club's fixtures this round: before a kickoff there is nothing to break down. */
  opposition: Opposition[] | undefined;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} aria-label={name} className="block w-full">
        {children}
      </button>
      {open ? (
        <PickCard pick={pick} name={name} player={player} club={club} opposition={opposition} onClose={() => setOpen(false)} />
      ) : null}
    </>
  );
}

/** The card itself: the player card's head, identity and foot, his FPL breakdown in the middle. No profile: FPL's
 *  man has no Fantrax id on this tab, so Close stands alone. */
export function PickCard({
  pick,
  name,
  player,
  club,
  opposition,
  onClose,
}: Omit<Parameters<typeof PickPoints>[0], "children"> & { onClose: () => void }) {
  // A man on the bench counts for nothing unless FPL multiplied him in, as a bench boost does.
  const reserve = pick.multiplier === 0;
  const started = kickedOff(opposition);
  return (
    <Modal
      onClose={onClose}
      width="24rem"
      closesOnBack
      head={<DialogHead title={name} club={club?.shortName ?? null} onClose={onClose} />}
      foot={<DialogFoot onClose={onClose} />}
    >
      <div className="flex flex-col gap-2 p-3">
        <FootballerIdentity
          player={player}
          keeper={isFplKeeper(pick.line)}
          position={fplLineName(pick.line)}
          club={club}
          opposition={opposition}
        />
        {started ? (
          <Breakdown
            breakdown={scoreRows(pick)}
            points={reserve ? pick.scored : pick.points}
            reserve={reserve}
            minutes={minutesOf(pick)}
            over={matchesOver(opposition)}
            totalInk="direction"
          />
        ) : null}
      </div>
    </Modal>
  );
}
