"use client";

import { type ReactNode, createContext, useContext, useId, useState } from "react";

// A match's row whose counts open the reader's men under it; each count sits under its own club's name.

const Open = createContext<{ open: boolean; flip: () => void; id: string } | null>(null);

export default function Yours({ row, children }: { row: ReactNode; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <Open.Provider value={{ open, flip: () => setOpen(!open), id }}>
      {row}
      <div id={id} hidden={!open}>
        {children}
      </div>
    </Open.Provider>
  );
}

/** "2 yours" under a club's name: a sibling of the name's link, never inside it, so neither tap swallows the other. */
export function YoursToggle({ count }: { count: number }) {
  const state = useContext(Open);
  if (state === null) return null;
  return (
    <button
      type="button"
      aria-expanded={state.open}
      aria-controls={state.id}
      onClick={state.flip}
      className="numeric flex min-h-11 shrink-0 cursor-pointer items-start gap-0.5 lg:items-center text-2xs font-semibold text-accent hover:brightness-110 lg:min-h-7"
    >
      {count} yours
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        className={`h-3 w-3 shrink-0 text-faint transition-transform duration-200 ${state.open ? "rotate-180" : ""}`}
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
      >
        <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}
