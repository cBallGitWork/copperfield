import type { ReactNode } from "react";
import { ROW_NAME } from "@/app/desk";
import { Holder } from "../../../../players/BoardRow";
import type { Held } from "../../../../players/holder";
import NameLink from "../NameLink";

/** A taker's name then his holder tag, as the boards print it: the name truncates first and the pair fills the row. */
export default function TakerName({
  href,
  held,
  teamNames,
  reader,
  children,
}: {
  href: string | null;
  /** Undefined for a man our league does not list: no tag. */
  held: Held | undefined;
  teamNames: ReadonlyMap<string, string>;
  reader: string | null;
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
      {held === undefined ? null : (
        <Holder held={held} teamNames={teamNames} reader={reader} className="max-w-28 shrink-0" />
      )}
    </span>
  );
}
