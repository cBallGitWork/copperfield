"use client";

import { type ReactNode, useId, useState } from "react";

// A match's row with the reader's count beside it: the count opens his men under the row, the row keeps its own link.

export default function Yours({
  row,
  count,
  className,
  children,
}: {
  row: ReactNode;
  count: number;
  /** The count's column, as the rows without one hold it. */
  className: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <>
      <div className="flex items-stretch">
        <div className="min-w-0 flex-1">{row}</div>
        {/* A sibling of the row's link, never inside it, so neither tap swallows the other. */}
        <button
          type="button"
          aria-expanded={open}
          aria-controls={id}
          onClick={() => setOpen(!open)}
          className={`cm-row min-h-11 cursor-pointer gap-1 hover:brightness-110 ${className}`}
        >
          {count} yours
          <svg
            aria-hidden
            viewBox="0 0 24 24"
            className={`h-4 w-4 shrink-0 text-faint transition-transform duration-200 ${open ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
      <div id={id} hidden={!open}>
        {children}
      </div>
    </>
  );
}
