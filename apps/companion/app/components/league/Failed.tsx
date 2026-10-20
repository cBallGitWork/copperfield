import type { ReactNode } from "react";
import { SMALL_CAPS } from "@/app/desk";

// A read that failed, in the house's "right now" words and muted ink, with a way to ask again; never an empty panel.

export default function Failed({ onRetry, children }: { onRetry?: () => void; children: ReactNode }) {
  return (
    <div className="cm-panel flex items-center gap-2 pl-3">
      <p className="min-w-0 flex-1 py-2 text-2xs text-muted">{children}</p>
      {onRetry === undefined ? null : (
        <button type="button" onClick={onRetry} className={`flex min-h-11 shrink-0 items-center px-3 ${SMALL_CAPS} text-accent`}>
          Try again
        </button>
      )}
    </div>
  );
}
