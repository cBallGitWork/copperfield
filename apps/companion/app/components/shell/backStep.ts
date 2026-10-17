// Where the phone's back plate goes. No `"use client"`: a pure decision, so it can be tested.

/** The Navigation API's own entry for this page, whose `index` counts only this app's entries; null where unsupported. */
export interface PageEntry {
  index: number;
}

/** Back to the app's page behind this one, or the section's list when the app has none behind it. */
export function backStep(entry: PageEntry | null, historyLength: number): "back" | "list" {
  if (entry !== null) return entry.index > 0 ? "back" : "list";
  return historyLength > 1 ? "back" : "list";
}
