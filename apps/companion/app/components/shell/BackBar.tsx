import type { ReactNode } from "react";
import { PINNED_TOP } from "@/app/desk";
import BackPlate from "./BackPlate";
import Pinned from "./Pinned";

/** A screen's title bar with its way back, locked to the top of a phone: a page's bar, a match's, a head-to-head's. */
export default function BackBar({ back, children }: { back: string; children: ReactNode }) {
  return (
    <Pinned edge="top" className={PINNED_TOP}>
      <header className="flex items-stretch">
        <BackPlate fallback={back} />
        {children}
      </header>
    </Pinned>
  );
}
