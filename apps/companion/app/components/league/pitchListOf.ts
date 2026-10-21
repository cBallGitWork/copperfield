import type { View } from "./ViewToggle";

// Which reading `?view=` names, for every squad screen with a Pitch and a List: a club's, a manager's, your own.

/** The view a query names, or the screen's own opening one. */
export function pitchListOf(raw: string | undefined, opens: View): View {
  return raw === "pitch" || raw === "list" ? raw : opens;
}
