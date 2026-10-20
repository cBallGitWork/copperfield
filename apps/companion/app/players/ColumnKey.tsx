"use client";

import { useState } from "react";
import Modal from "../components/shell/Modal";
import DialogHead from "../components/shell/DialogHead";

// The board's key in one tap (Craig, 19 Oct 2026: "and a glossary"): each head and what it counts, in the house dialog.

interface KeyEntry {
  label: string;
  title: string;
  means?: string;
}

export default function ColumnKey({ entries, className }: { entries: readonly KeyEntry[]; className: string }) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  return (
    <>
      <button type="button" aria-haspopup="dialog" onClick={() => setOpen(true)} className={className}>
        Key
      </button>
      {open ? (
        <Modal onClose={close} width="28rem" closesOnBack head={<DialogHead title="Key" club={null} onClose={close} />}>
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 p-3 text-sm">
            {entries.map((entry) => (
              <div key={entry.label} className="contents">
                <dt className="numeric font-bold text-ink">{entry.label}</dt>
                <dd className="text-muted">
                  <span className="text-ink">{entry.title}</span>
                  {entry.means ? `. ${entry.means}` : null}
                </dd>
              </div>
            ))}
          </dl>
        </Modal>
      ) : null}
    </>
  );
}
