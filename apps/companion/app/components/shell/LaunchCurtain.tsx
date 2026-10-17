"use client";

import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { launchExit, launchShownAt } from "../../launchFrame";

// Holds the launch frame up until the app has hydrated and its minimum has run, fades it, then takes it out of the
// tree. It mounts once per document, so a tap or a pull to refresh never brings it back.

export default function LaunchCurtain({ style, children }: { style: CSSProperties; children: ReactNode }) {
  const [stage, setStage] = useState<"up" | "leaving" | "gone">("up");

  useEffect(() => {
    const shownAt = launchShownAt(document.documentElement.dataset.launch);
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const { leave, gone } = launchExit(shownAt, performance.now(), reduced);
    const timers = [setTimeout(() => setStage("leaving"), leave), setTimeout(() => setStage("gone"), gone)];
    return () => timers.forEach(clearTimeout);
  }, []);

  if (stage === "gone") return null;
  return (
    <div aria-hidden className="cm-launch" data-leaving={stage === "leaving" || undefined} style={style}>
      {children}
    </div>
  );
}
