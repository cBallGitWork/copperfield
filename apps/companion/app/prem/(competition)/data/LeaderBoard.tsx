import type { ReactNode } from "react";
import Link from "@/app/components/shell/Link";
import { crestUrl, ordinal, printed, type Club } from "@epl/core";
import Board from "../../../components/league/Board";
import LeadFace, { LEAD_BOX } from "../../../components/league/LeadFace";
import NameLink from "../../club/[code]/NameLink";
import { PANEL_FLUSH, SECTION_BAR, SMALL_CAPS } from "@/app/desk";
import type { LeaderList, Ranked } from "./leaders";

// One list: the men in order, his club's crest and his name, the one figure in amber (ours in cyan), and the way to more.

export interface Row extends Ranked {
  club: Club | undefined;
  /** His own page, or null when our league does not list him. */
  href: string | null;
  /** What follows his name, as who holds him on Live's lists. */
  tail?: ReactNode;
}

export default function LeaderBoard({
  list,
  rows,
  more,
  className = "",
}: {
  list: LeaderList;
  rows: readonly Row[];
  /** The plate under the list: where it leads and what it says; none on a list that stops where it is. */
  more?: { href: string; label: string };
  className?: string;
}) {
  // A mark or our DefCon points is a derived reading, which DESIGN §3 inks cyan; a recorded figure alone beside a name is amber.
  const ink = list.source === "rating" || list.source === "defcon" ? "text-info" : "text-mid";
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
            index: { label: "Place", of: (row) => ordinal(row.rank) },
            name: {
              label: "Player",
              of: (row) => (
                <NameLink href={row.href} className={LEAD_BOX}>
                  <LeadFace crest={row.club === undefined ? null : crestUrl({ code: row.club.code })} name={row.name} short={null} after={row.tail} />
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
              cell: (row: Row) => ({ value: printed(list, row.figure), className: ink }),
            },
          ]}
        />
      )}
      {more === undefined ? null : (
        <Link
          href={more.href}
          className={`cm-bevel m-2 flex min-h-11 items-center justify-center ${SMALL_CAPS} hover:brightness-110 lg:min-h-9`}
        >
          {more.label}
        </Link>
      )}
    </section>
  );
}
