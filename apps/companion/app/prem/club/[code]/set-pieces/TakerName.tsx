import type { ReactNode } from "react";
import { ROW_NAME } from "@/app/desk";
import { Holder } from "../../../../players/BoardRow";
import type { Held } from "../../../../players/holder";
import NameLink from "../NameLink";

/** A taker's name, his mark, then his holder tag, as the boards print it: the name truncates first and the row fills. */
export default function TakerName({
  href,
  held,
  teamNames,
  reader,
  mark,
  children,
}: {
  href: string | null;
  /** Undefined for a man our league does not list: no tag. */
  held: Held | undefined;
  teamNames: ReadonlyMap<string, string>;
  reader: string | null;
  /** His `StateMark`, straight after the name; null for a fit man. */
  mark?: ReactNode;
  children: ReactNode;
}) {
  return (
    <span className="flex min-w-0 flex-1 items-center gap-1">
      <NameLink
        href={href}
        // The row's floor restated on the link, which `tapfit` measures; `self-stretch` lands one short.
        className={`flex min-h-9 min-w-0 items-center truncate text-ink ${ROW_NAME}`}
      >
        {children}
      </NameLink>
      {mark}
      {held === undefined ? null : (
        <Holder held={held} teamNames={teamNames} reader={reader} className="max-w-28 shrink-0" />
      )}
    </span>
  );
}
