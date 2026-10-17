// The browser's Navigation API, which TypeScript's DOM types do not yet carry; client code only.

interface HistoryEntry {
  key: string;
  index: number;
  url: string | null;
}

interface Navigation {
  currentEntry: HistoryEntry | null;
  entries(): HistoryEntry[];
}

function navigation(): Navigation | null {
  return (window as { navigation?: Navigation }).navigation ?? null;
}

/** This page's own history entry, whose key Back returns to; null where unsupported. */
export function currentEntry(): HistoryEntry | null {
  return navigation()?.currentEntry ?? null;
}

/** The page behind this one: its URL, null when the app has none, undefined where the browser cannot say. */
export function urlBehind(): string | null | undefined {
  const entries = navigation();
  const current = entries?.currentEntry;
  if (entries === null || current == null) return undefined;
  return current.index > 0 ? (entries.entries()[current.index - 1]?.url ?? undefined) : null;
}
