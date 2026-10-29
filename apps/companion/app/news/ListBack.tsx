"use client";

import { useRouter } from "next/navigation";
import Link from "../components/shell/Link";
import { BUTTON } from "../components/shell/ButtonLink";
import { urlBehind } from "../components/shell/historyEntry";
import { plainClick } from "../components/shell/plainClick";
import { listStep } from "./listStep";

/** A letter's way back to its list on a phone: Back when the list is the page behind, so Back never reopens the
 *  letter; the list in the letter's place for one opened cold. */
export default function ListBack({ href, label }: { href: string; label: string }) {
  const router = useRouter();
  return (
    <Link
      href={href}
      onClick={(event) => {
        // A modified click keeps the browser's own meaning: a new tab, a new window.
        if (!plainClick(event)) return;
        event.preventDefault();
        if (listStep(urlBehind(), href, history.length) === "back") router.back();
        else router.replace(href);
      }}
      // Held under any locked bar above it, so the way back to the list stays under the thumb down a long letter.
      className={`${BUTTON} gap-2 max-lg:sticky max-lg:top-[var(--pin-top)] max-lg:z-20 lg:hidden`}
    >
      <span aria-hidden>←</span>
      {label}
    </Link>
  );
}
