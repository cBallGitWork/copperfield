import type { ReactNode } from "react";
import type { SquadPlayerDetail } from "@epl/core";
import { ROW_NAME } from "@/app/desk";
import { Holder } from "../../../../players/BoardRow";
import type { Held } from "../../../../players/holder";
import { MaybeCard } from "../../../../components/league/PlayerCardButton";

/** A taker's name opening his card, his mark, then his holder tag, as the boards print it: the name truncates first and the row fills. */
export default function TakerName({
  card,
  held,
  teamNames,
  reader,
  mark,
  children,
}: {
  /** His player card; undefined for a man our league does not list, whose name is plain. */
  card: SquadPlayerDetail | undefined;
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
      <MaybeCard
        player={card}
        // The row's floor restated on the link, which `tapfit` measures; `self-stretch` lands one short.
        className={`flex min-h-9 min-w-0 items-center truncate text-left text-ink hover:underline ${ROW_NAME}`}
      >
        {children}
      </MaybeCard>
      {mark}
      {held === undefined ? null : (
        <Holder held={held} teamNames={teamNames} reader={reader} className="max-w-28 shrink-0" />
      )}
    </span>
  );
}
