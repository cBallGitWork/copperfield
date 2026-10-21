import type { ReactNode } from "react";
import { crestUrl, fullFootballerName, printed, printedPlaces, DASH, type Club, type FootballPlayer } from "@epl/core";
import Board from "../components/league/Board";
import LeadFace, { LEAD_BOX } from "../components/league/LeadFace";
import NameLink from "../prem/club/[code]/NameLink";
import FitnessMark from "../components/football/FitnessMark";
import { PANEL_FLUSH, SECTION_BAR } from "@/app/desk";
import { figureInk, type LeaderList, type Ranked } from "./lists";

// One list: the men in order, his club's crest, his name and CM's mark, the one figure in amber (FPts cyan), every one recorded.

export interface Row extends Ranked {
  club: Club | undefined;
  /** His own page, or null when our league does not list him. */
  href: string | null;
  /** The footballer behind him, for his name in full and his fitness mark; undefined where FPL has no such code. */
  footballer: FootballPlayer | undefined;
  /** What follows his name, as who holds him on Live's lists. */
  tail?: ReactNode;
}

export default function LeaderBoard({
  list,
  rows,
  className = "",
}: {
  list: LeaderList;
  rows: readonly Row[];
  className?: string;
}) {
  const places = printedPlaces(rows, (row) => String(row.code));
  return (
    <section className={`${PANEL_FLUSH} ${className}`}>
      {/* On a phone the picker above already names the one list it shows. */}
      <h3 className={`${SECTION_BAR} max-lg:sr-only`}>{list.title}</h3>
      {rows.length === 0 ? (
        <p className="px-2 py-3 text-sm text-muted">Nothing to rank yet.</p>
      ) : (
        <Board
          fixed
          caption={`${list.title}, the top ${rows.length}`}
          rows={rows}
          keyOf={(row) => String(row.code)}
          lead={{
            index: { label: "Place", of: (row) => places.get(String(row.code)) ?? DASH },
            name: {
              label: "Player",
              of: (row) => (
                <NameLink href={row.href} className={LEAD_BOX}>
                  <LeadFace
                    crest={row.club === undefined ? null : crestUrl({ code: row.club.code })}
                    name={row.footballer === undefined ? row.name : fullFootballerName(row.footballer)}
                    after={<><FitnessMark player={row.footballer ?? null} />{row.tail}</>}
                  />
                </NameLink>
              ),
            },
          }}
          order={{ key: "figure", descending: true }}
          columns={[
            {
              key: "figure",
              head: list.head,
              title: list.explain,
              width: "w-16",
              cell: (row: Row) => ({ value: printed(list, row.figure), className: figureInk(list) }),
            },
          ]}
        />
      )}
    </section>
  );
}
