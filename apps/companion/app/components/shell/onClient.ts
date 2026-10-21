import { useSyncExternalStore } from "react";

const never = () => () => undefined;

/** False on the server and while hydrating, true after: what may touch `document` without a hydration mismatch. */
export function useOnClient(): boolean {
  return useSyncExternalStore(never, () => true, () => false);
}
