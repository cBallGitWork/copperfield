"use client";

import { use } from "react";
import Link from "./Link";
import { BUTTON } from "./ButtonLink";
import { ModalContext } from "./Modal";

// The foot of a player dialog: the full profile beside Close.

export default function DialogFoot({
  href,
  onClose,
}: {
  /** Where the player is written up in full. */
  href: string;
  onClose: () => void;
}) {
  const modal = use(ModalContext);
  return (
    <div className="flex gap-2">
      {/* In place of the card's history entry, so Back from his profile lands on the page, not on a shut card. */}
      <Link href={href} replace={modal?.close !== undefined} className={`${BUTTON} flex-1`}>
        Full profile
      </Link>
      <button type="button" onClick={modal?.close ?? onClose} className={`${BUTTON} flex-1`}>
        Close
      </button>
    </div>
  );
}
