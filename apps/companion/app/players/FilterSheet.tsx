"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Modal from "../components/shell/Modal";
import DialogHead from "../components/shell/DialogHead";
import { PANEL, SECTION_BAR } from "@/app/desk";
import type { BoardChange } from "./boardChange";
import { ask } from "./liveQuery";
import { BELOW_LG } from "../breakpoints";

// The board's filters: the house dialog under a thumb, an inline panel from `lg`. Open is URL state, so closing
// replaces it with the board `close` makes; the server's first paint is the panel, which a phone swaps for the dialog.

function subscribe(changed: () => void): () => void {
  const query = matchMedia(BELOW_LG);
  query.addEventListener("change", changed);
  return () => query.removeEventListener("change", changed);
}

export default function FilterSheet({
  title,
  close,
  foot,
  children,
}: {
  title: string;
  close: BoardChange;
  /** Pinned under the controls: the way back to the board. */
  foot: ReactNode;
  children: ReactNode;
}) {
  const router = useRouter();
  const phone = useSyncExternalStore(subscribe, () => matchMedia(BELOW_LG).matches, () => false);

  if (!phone) {
    return (
      <div className={PANEL}>
        <p className={SECTION_BAR}>{title}</p>
        {children}
        <div className="border-t border-line pt-2">{foot}</div>
      </div>
    );
  }

  const shut = () => router.replace(ask(close), { scroll: false });
  return (
    <Modal onClose={shut} width="28rem" head={<DialogHead title={title} club={null} onClose={shut} />} foot={foot}>
      <div className="flex flex-col gap-2 p-2">{children}</div>
    </Modal>
  );
}
