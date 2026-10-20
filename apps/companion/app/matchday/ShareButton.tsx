"use client";

import { useRef, type MouseEvent } from "react";
import { BUTTON } from "../components/shell/ButtonLink";

// The gameweek's ties as a picture: the phone's share sheet where it takes a file, else the picture opens to be saved.

/** Whether this browser's share sheet takes a PNG; false where there is no sheet at all. */
function sharesFiles(name: string): boolean {
  if (typeof navigator.canShare !== "function") return false;
  return navigator.canShare({ files: [new File([], name, { type: "image/png" })] });
}

export default function ShareButton({ href, name }: { href: string; name: string }) {
  // Fetched from the touch, not the click, so the sheet opens inside the tap's own allowance of time.
  const drawn = useRef<Promise<Blob> | null>(null);
  const picture = () => fetch(href, { cache: "no-store" }).then((answer) => answer.blob());
  const draw = () => {
    if (sharesFiles(name)) drawn.current = picture();
  };

  async function share(event: MouseEvent<HTMLAnchorElement>) {
    if (!sharesFiles(name)) return;
    event.preventDefault();
    try {
      const blob = await (drawn.current ?? picture());
      await navigator.share({ files: [new File([blob], name, { type: "image/png" })] });
    } catch (error) {
      // Closing the sheet is a choice; anything else shows the picture, to be held and saved.
      if (error instanceof DOMException && error.name === "AbortError") return;
      if (window.open(href, "_blank") === null) window.location.assign(href);
    } finally {
      drawn.current = null;
    }
  }

  return (
    <a href={href} target="_blank" rel="noopener" onPointerDown={draw} onClick={share} className={BUTTON}>
      Share the scores
    </a>
  );
}
