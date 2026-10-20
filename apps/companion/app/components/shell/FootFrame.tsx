import type { ReactNode } from "react";

// A screen's own sub-views switch from the foot (a `TabStrip`, `GroupNav` or `QuerySelect` in `foot`), so the top keeps one row of blue plates.

/** The foot row's dock: above the thumb rail on a phone, at the screen's foot on the desk; `ListAndPitch` docks in it too. */
export const FOOT_DOCK = "sticky bottom-[var(--thumbrail)] z-20 mt-auto bg-bg lg:bottom-0";

/** The dock's height (one `min-h-11` strip), so a wide board's gauge (`desk.css`) docks above it, not under it. */
const FOOT_DOCK_HEIGHT = "[--foot-dock:2.75rem]";

/** A screen at least the viewport tall, its foot at the bottom when the body is short and docked when it is long: above
 *  the thumb rail on a phone, at the screen's foot on the desk, as `SaveBar` is (review M7).
 *  The viewport less the insets `body` pads by, or the installed app scrolls by both. */
export function FootFrame({ foot, className = "", children }: { foot?: ReactNode; className?: string; children: ReactNode }) {
  return (
    <div
      className={`${foot === undefined ? "" : `${FOOT_DOCK_HEIGHT} `}flex min-h-[calc(100dvh-var(--safe-top)-var(--safe-bottom)-var(--page-top)-var(--page-foot))] flex-col gap-2 ${className}`}
    >
      {children}
      {foot === undefined ? null : <div className={FOOT_DOCK}>{foot}</div>}
    </div>
  );
}
