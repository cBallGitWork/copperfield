"use client";

import { type ReactNode, createContext, useContext, useId, useState } from "react";
import Chevron from "../components/shell/Chevron";

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

/** His count beside a club's name: a yours-yellow pill under a thumb, "2 yours" from `lg`. A sibling of the name's link,
 *  never inside it, so neither tap swallows the other. */
export function YoursToggle({ count }: { count: number }) {
  const state = useContext(Open);
  if (state === null) return null;
  return (
    <button
      type="button"
      aria-expanded={state.open}
      aria-controls={state.id}
      onClick={state.flip}
      aria-label={`${count} yours`}
      className="numeric flex min-h-9 shrink-0 cursor-pointer items-center gap-0.5 px-1 text-2xs font-bold text-accent hover:brightness-110 max-[359px]:px-0 lg:min-h-7 lg:px-0"
    >
      <span aria-hidden className="min-w-4 bg-accent px-1 text-center leading-4 text-bg max-[359px]:px-0.5 lg:hidden">
        {count}
      </span>
      <span aria-hidden className="hidden lg:inline">
        {count} yours
      </span>
      <Chevron open={state.open} className="hidden h-3 w-3 lg:block" />
    </button>
  );
}
