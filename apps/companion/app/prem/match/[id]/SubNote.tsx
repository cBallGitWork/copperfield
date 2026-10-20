import type { PlManMatch } from "@epl/core";
import { minuteMark } from "./minuteMark";

/** `sub on 64'`, `sub off 90+2' inj`, or both, in CM's amber — `cm9900/02.jpg`'s `in 77` / `ut 77`. */
export default function SubNote({
  onAt,
  offAt,
  added,
  hurt = false,
  className = "",
}: {
  onAt: number | null | undefined;
  offAt: number | null | undefined;
  /** The added time beside either minute, so this note and the scoresheet print the same exit. */
  added?: PlManMatch["added"];
  hurt?: boolean;
  className?: string;
}) {
  const parts = [
    onAt == null ? null : `sub on ${minuteMark(onAt, added?.onAt)}`,
    offAt == null ? null : `sub off ${minuteMark(offAt, added?.offAt)}${hurt ? " inj" : ""}`,
  ].filter((part) => part !== null);
  return parts.length === 0 ? null : (
    <span
      className={`numeric ml-auto shrink-0 whitespace-nowrap pl-2 text-xs font-bold text-mid lg:text-sm ${className}`}
    >
      {parts.join(" · ")}
    </span>
  );
}
