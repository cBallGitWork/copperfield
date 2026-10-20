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
          className={`cm-row min-h-11 cursor-pointer hover:brightness-110 ${className}`}
        >
          {count} yours
        </button>
      </div>
      <div id={id} hidden={!open}>
        {children}
      </div>
    </>
  );
}
