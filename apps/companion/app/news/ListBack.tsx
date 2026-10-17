"use client";

import { useRouter } from "next/navigation";
import Link from "../components/shell/Link";
import { BUTTON } from "../components/shell/ButtonLink";
import { urlBehind } from "./historyEntry";
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
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
        event.preventDefault();
        if (listStep(urlBehind(), href, history.length) === "back") router.back();
        else router.replace(href);
      }}
      className={`${BUTTON} gap-2 lg:hidden`}
    >
      <span aria-hidden>←</span>
      {label}
    </Link>
  );
}
