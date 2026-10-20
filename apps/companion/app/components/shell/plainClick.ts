// No `"use client"`: a DOM click and React's both carry these fields.

/** A primary click with no modifier; any other keeps the browser's own meaning (a new tab, a new window). */
export function plainClick(event: { button: number; metaKey: boolean; ctrlKey: boolean; shiftKey: boolean; altKey: boolean }): boolean {
  return event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
}
