"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { BUTTON } from "./ButtonLink";

/** Asks the server for this page again; an empty answer is never stored, so the next one asks the provider. */
export default function TryAgain() {
  const router = useRouter();
  const [asking, startAsking] = useTransition();
  return (
    <button type="button" disabled={asking} onClick={() => startAsking(() => router.refresh())} className={`${BUTTON} min-w-32 disabled:opacity-50`}>
      {asking ? "Asking…" : "Try again"}
    </button>
  );
}
