"use client";

import { useRouter } from "next/navigation";
import { backStep, type PageEntry } from "./backStep";

/** The phone's back button: back to the app's page behind, or the section's list (`fallback`) in this page's place. */
export default function BackPlate({ fallback }: { fallback: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      aria-label="Back"
      onClick={() => (backStep(currentEntry(), history.length) === "back" ? router.back() : router.replace(fallback))}
      className="cm-bevel flex w-11 shrink-0 items-center justify-center text-lg font-bold lg:hidden"
    >
      <span aria-hidden>←</span>
    </button>
  );
}

/** `navigation.currentEntry`, which TypeScript's DOM types do not yet carry. */
function currentEntry(): PageEntry | null {
  const navigation = (window as { navigation?: { currentEntry?: PageEntry | null } }).navigation;
  return navigation?.currentEntry ?? null;
}
