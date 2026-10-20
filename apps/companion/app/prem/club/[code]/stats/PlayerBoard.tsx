"use client";

import { useMemo, useState } from "react";
import NameLink from "../NameLink";
import { DASH, fullFootballerName, type FootballPlayer } from "@epl/core";
import { viewOf, reading } from "./measures";
import { PANEL } from "@/app/desk";
import Board from "../../../../components/league/Board";
import LeadFace from "../../../../components/league/LeadFace";
import { TIGHT_ROW } from "../../../../components/league/TableCells";
import { SIDE_SHARES, standoutCuts, standoutInk } from "../../../../components/league/standout";
import StateBox from "../../../../components/football/StateBox";
import { doubtRow } from "../../../../components/football/doubtRow";

// A club's season, player by player: our position in the tile, standouts lit, doubts washed.
// Client only because sorting is a tap here; the view is the page's, from its foot strip (`?view=`).

/** The lead's link at PRODUCT's 36px under a thumb, as `LEAD_LINK` is wide. */
const TIGHT_LEAD = `${TIGHT_ROW} w-40 px-1.5 text-left lg:w-64`;

export interface Row {
  player: FootballPlayer;
  /** What our league files him at; empty when Fantrax has no opinion or would not answer. */
  positions: readonly string[];
  /** His own page, or null when our league does not list him. */
  href: string | null;
}

/** A man with no minutes, whose noughts are no reading: a dash, and under the rest whichever way a column sorts. */
const unplayed = (row: Row) => row.player.season.minutes <= 0;

/** A column's order, most first or least, with the men who have not played always last. */
export function unplayedLast(key: keyof FootballPlayer["season"], descending: boolean) {
  return (a: Row, b: Row): number => {
    const gap = Number(unplayed(a)) - Number(unplayed(b));
    if (gap !== 0) return gap;
    const [x, y] = [a.player.season[key], b.player.season[key]];
    return descending ? y - x : x - y;
  };
}

export default function PlayerBoard({ rows, view }: { rows: readonly Row[]; view: string }) {
  // Null keeps the page's order, keeper first by our league's position, rather than a default sort.
  const [sort, setSort] = useState<{ key: keyof FootballPlayer["season"]; descending: boolean } | null>(
    null,
  );

  const shown = viewOf(view);
  const { measures } = shown;
  // Each column's standouts among the men who have played, as a match board lights them.
  const played = rows.filter((row) => !unplayed(row)).length;
  const cuts = new Map(
    measures.map((measure) => [
      measure.key,
      standoutCuts(rows.map((row) => row.player.season[measure.key]), SIDE_SHARES, { of: played }),
    ]),
  );

  const ordered = useMemo(() => {
    if (sort === null) return [...rows];
    return [...rows].sort(unplayedLast(sort.key, sort.descending));
  }, [rows, sort]);

  /** Tapping a head sorts by it, most first; tapping the sorted one turns it round. */
  const sortBy = (key: keyof FootballPlayer["season"]) =>
    setSort((current) =>
      current?.key === key ? { key, descending: !current.descending } : { key, descending: true },
    );

  return (
    <section className={PANEL}>
      <Board
        caption={`Every player's ${shown.label.toLowerCase()} figures`}
        rows={ordered}
        keyOf={(row) => String(row.player.id)}
        rowClass={(row) => doubtRow(row.player)}
        lead={{
          tile: { positions: (row) => row.positions, deskOnly: true },
          name: {
            label: "Player",
            className: (row) => doubtRow(row.player),
            of: ({ player, positions, href }) => (
              <NameLink href={href} className={TIGHT_LEAD}>
                <LeadFace name={fullFootballerName(player)} positions={positions} after={<StateBox player={player} />} />
              </NameLink>
            ),
          },
        }}
        order={{
          key: sort?.key ?? null,
          descending: sort?.descending ?? true,
          onSort: (key) => sortBy(key as keyof FootballPlayer["season"]),
        }}
        columns={measures.map((measure) => ({
          key: measure.key,
          head: measure.head,
          title: measure.label,
          cell: (row: Row) => {
            // His minutes are the one reading a man who has not played has: a nought there is the fact itself.
            if (measure.key !== "minutes" && unplayed(row)) return { value: DASH, className: "text-faint" };
            const { player } = row;
            const value = player.season[measure.key];
            const ink = standoutInk(value, cuts.get(measure.key), measure.worse ? "low" : "high");
            return { value: reading(measure, value), className: ink || (value === 0 ? "text-muted" : "text-ink") };
          },
        }))}
      />
    </section>
  );
}
