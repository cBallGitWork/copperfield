import type { ReactNode } from "react";
import { LABEL, QUIET_FIGURE } from "@/app/desk";

/** A player card block's head: its label, and a quiet figure at the right edge where there is one. */
export default function CardBlock({ label, aside }: { label: string; aside?: ReactNode }) {
  return (
    <p className="flex items-baseline justify-between gap-2">
      <span className={LABEL}>{label}</span>
      {aside ? <span className={QUIET_FIGURE}>{aside}</span> : null}
    </p>
  );
}
