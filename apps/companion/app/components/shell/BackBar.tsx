import type { ReactNode } from "react";
import { PINNED_TOP } from "@/app/desk";
import BackPlate from "./BackPlate";
import Pinned from "./Pinned";

/** A screen's title bar with its way back, locked to the top of a phone: a page's bar, a match's, a head-to-head's.
 *  `under` locks with it: a subject's tabs. */
export default function BackBar({ back, under, children }: { back: string; under?: ReactNode; children: ReactNode }) {
  return (
    <Pinned edge="top" className={PINNED_TOP}>
      <header className="flex items-stretch">
        <BackPlate fallback={back} />
        {children}
      </header>
      {under}
    </Pinned>
  );
}
