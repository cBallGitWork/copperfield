import { historyStep } from "../components/shell/backStep";

// Where a letter's "All mail" goes. No `"use client"`: a pure decision, so it can be tested.

/** Back when the page behind is the list itself, else the list in the letter's place. `behind` is that page's URL,
 *  null when the app has none behind, undefined where the browser cannot say (no Navigation API). */
export function listStep(behind: string | null | undefined, list: string, historyLength: number): "back" | "list" {
  if (behind === undefined) return historyStep(historyLength);
  if (behind === null) return "list";
  const url = new URL(behind);
  return `${url.pathname}${url.search}` === list ? "back" : "list";
}
