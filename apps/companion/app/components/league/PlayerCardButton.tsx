"use client";

import { useState, type ComponentProps, type ReactNode } from "react";
import type { SquadPlayerDetail } from "@epl/core";
import PlayerCard from "./PlayerCard";

// The one trigger for the app's one player card: any name in a list or on a pitch that opens him (Craig, 23 Sep and
// 21 Oct 2026). The card's own props ride through, so a scoring screen hands its breakdown the same way.

/** What a screen may hand the card beyond the man himself. */
type CardProps = Omit<ComponentProps<typeof PlayerCard>, "player" | "onClose">;

export default function PlayerCardButton({
  player,
  className,
  label,
  children,
  ...card
}: CardProps & {
  player: SquadPlayerDetail;
  className: string;
  /** The button's name where its content is not his name (a pitch disc's position letter). */
  label?: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} aria-label={label} className={className}>
        {children}
      </button>
      {open ? <PlayerCard {...card} player={player} onClose={() => setOpen(false)} /> : null}
    </>
  );
}

/** The card's trigger where our league knows him, and a plain label where it does not. */
export function MaybeCard({
  player,
  className,
  children,
  ...card
}: CardProps & {
  player: SquadPlayerDetail | undefined;
  className: string;
  children: ReactNode;
}) {
  return player === undefined ? (
    <span className={className}>{children}</span>
  ) : (
    <PlayerCardButton {...card} player={player} className={className}>
      {children}
    </PlayerCardButton>
  );
}
