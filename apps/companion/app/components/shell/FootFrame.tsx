import type { ReactNode } from "react";
import Pinned from "./Pinned";

// A screen's own sub-views switch from the foot (a `TabStrip`, `GroupNav` or `QuerySelect` in `foot`), so the top keeps one row of blue plates.

/** The foot row's dock: above the thumb rail on a phone, at the screen's foot on the desk; `ListAndPitch` docks in it too. */
export const FOOT_DOCK = "sticky bottom-[var(--thumbrail)] z-20 mt-auto bg-bg lg:bottom-0";

/** At least the viewport tall: the viewport less the insets `body` pads by, or the installed app scrolls by both. */
export const SCREEN_TALL = "min-h-[calc(100dvh-var(--safe-top)-var(--safe-bottom)-var(--page-top)-var(--page-foot))]";

/** A screen at least the viewport tall, its foot at the bottom when the body is short and docked when it is long: above
 *  the thumb rail on a phone, at the screen's foot on the desk, as `SaveBar` is (review M7). */
export function FootFrame({ foot, className = "", children }: { foot?: ReactNode; className?: string; children: ReactNode }) {
  return (
    <div className={`flex ${SCREEN_TALL} flex-col gap-2 ${className}`}>
      {children}
      {foot === undefined ? null : (
        <Pinned edge="foot" className={FOOT_DOCK}>
          {foot}
        </Pinned>
      )}
    </div>
  );
}
