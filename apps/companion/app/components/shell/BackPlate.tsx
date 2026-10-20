"use client";

import { useRouter } from "next/navigation";
import { backStep } from "./backStep";
import { cameFrom, stepFrom, steppedFrom } from "./CameFrom";
import { urlBehind } from "./historyEntry";

/** The phone's back button: Back, or where the browser has lost the page behind, the page the reader came from; the
 *  section's list (`fallback`) in this page's place for a page opened cold. */
export default function BackPlate({ fallback }: { fallback: string }) {
  const router = useRouter();
  const back = () => {
    const step = backStep(cameFrom(), urlBehind(), history.length, steppedFrom());
    if (step === "back") return router.back();
    if (step !== "list") stepFrom();
    router.replace(step === "list" ? fallback : step.to);
  };
  return (
    <button
      type="button"
      aria-label="Back"
      onClick={back}
      className="cm-bevel flex w-11 shrink-0 items-center justify-center text-lg font-bold lg:hidden"
    >
      <span aria-hidden>←</span>
    </button>
  );
}
