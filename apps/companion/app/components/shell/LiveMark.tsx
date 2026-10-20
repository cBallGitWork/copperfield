import type { ReactNode } from "react";

// The live dot and its word, never one without the other; ink, size and spacing are the caller's.

export default function LiveMark({ className = "gap-1.5", children }: {
  /** The caller's gap, ink and type: `--color-live` is unreadable on a light plate, so no ink is set here. */
  className?: string;
  /** What follows the word, such as a match's minute. */
  children?: ReactNode;
}) {
  return (
    <span className={`inline-flex items-center ${className}`}>
      <span className="live-dot" />
      Live{children}
    </span>
  );
}
