"use client";

import Link from "@/app/components/shell/Link";
import { useMemo, useState } from "react";
import { type FootballPlayer, type PlayerStatLine, DASH, crestForShortName, toFplClubCode } from "@epl/core";
import { type Beside, type Counts, VIEWS, type ViewKey, measuresFor, readingOf } from "./statViews";
import { playerHref } from "../../../players/routes";
import { positionsFromList } from "../../../positions";
import { SELECT } from "../../../components/shell/ButtonLink";
import BoardKey from "../../../components/league/BoardKey";
import Board from "../../../components/league/Board";
import LeadFace, { LEAD_LINK_TIGHT } from "../../../components/league/LeadFace";
import StateBox from "../../../components/football/StateBox";
import { doubtRow } from "../../../components/football/doubtRow";
import { byFigure } from "../../../components/league/order";
import { SIDE_SHARES, standoutCuts, standoutInk } from "../../../components/league/standout";
import { MINOR_LABEL, PANEL_FLUSH } from "@/app/desk";

// One squad's season on the house board, as a club's stat board draws it: our position in the index tile, the crest
// before the pinned name, a view picked above, a tap on a head to sort, and each column's standouts lit in ink.

/** One width for every figure column, so the name takes the slack and a long head does not. */
const FIGURE_WIDTH = "w-10 lg:w-14";

/** What his row is read from beside the served league's line. */
function besideOf(line: PlayerStatLine, statsLeague: Record<string, Counts>, defcon: Record<string, number | null> | null): Beside {
  return { statsLeague: statsLeague[line.fantraxId], defcon: defcon === null ? undefined : defcon[line.fantraxId] };
}

export default function StatBoard({
  lines,
  footballers,
  names,
  served,
  statsLeague,
  statsColumns,
  defcon,
}: {
  lines: readonly PlayerStatLine[];
  /** Every column the served league's read carries, which is the categories it scores. */
  served: readonly string[];
  /** His men's counts in the stats league by Fantrax id; absent for a man it has no row for, which reads as dashes. */
  statsLeague: Record<string, Counts>;
  /** Every column the stats league's read carries. */
  statsColumns: readonly string[];
  /** His men's DefCon points by Fantrax id, ours; null when the league prices no DefCon, which draws no column. */
  defcon: Record<string, number | null> | null;
  /** The footballer behind each Fantrax id, for his availability; absent where the bridge has not settled him. */
  footballers: Record<string, FootballPlayer>;
  /** The roster's spelling of each name, by id: Fantrax's stat rows say "Schade, Kevin". */
  names: Record<string, string>;
}) {
  const [view, setView] = useState<ViewKey>("scoring");
  // Null is the squad's own order, the one the Squad tab prints.
  const [sort, setSort] = useState<{ key: string; descending: boolean } | null>(null);

  const measures = measuresFor(view, new Set(served), new Set(statsColumns), defcon !== null);
  const cuts = new Map(
    measures.map((measure) => [
      measure.key,
      standoutCuts(lines.map((line) => measure.read(line, besideOf(line, statsLeague, defcon))), SIDE_SHARES, { of: lines.length }),
    ]),
  );

  const rows = useMemo(() => {
    if (sort === null) return [...lines];
    const read = (line: PlayerStatLine) => readingOf(line, besideOf(line, statsLeague, defcon), sort.key);
    return [...lines].sort((a, b) => byFigure(read(a), read(b), sort.descending));
  }, [lines, sort, statsLeague, defcon]);

  /** Opens descending, since "most" is the first question even of cards; a second tap turns it round. */
  const sortBy = (key: string) =>
    setSort((current) =>
      current?.key === key ? { key, descending: !current.descending } : { key, descending: true },
    );
  const wash = (line: PlayerStatLine) => doubtRow(footballers[line.fantraxId] ?? null);

  return (
    <section className={PANEL_FLUSH}>
      <div className="flex items-center gap-2 border-b border-line px-2 py-1.5">
        <label className={`${MINOR_LABEL}`} htmlFor="stat-view">
          View
        </label>
        <select
          id="stat-view"
          value={view}
          onChange={(event) => setView(event.target.value as ViewKey)}
          className={`${SELECT} min-w-0 flex-1 lg:max-w-52`}
        >
          {VIEWS.map((entry) => (
            <option key={entry.key} value={entry.key}>
              {entry.label}
            </option>
          ))}
        </select>
      </div>

      <Board
        rows={rows}
        keyOf={(line) => line.fantraxId}
        rowClass={wash}
        lead={{
          tile: { positions: (line) => positionsFromList(line.position), deskOnly: true },
          name: {
            label: "Player",
            className: wash,
            of: (line) => (
              <Link href={playerHref(line.fantraxId)} className={LEAD_LINK_TIGHT}>
                <LeadFace
                  crest={line.clubShort ? crestForShortName(toFplClubCode(line.clubShort)) : null}
                  name={names[line.fantraxId] ?? line.name}
                  positions={positionsFromList(line.position)}
                  after={<StateBox player={footballers[line.fantraxId] ?? null} />}
                />
              </Link>
            ),
          },
        }}
        order={{ key: sort?.key ?? null, descending: sort?.descending ?? true, onSort: sortBy }}
        columns={measures.map((measure) => ({
          key: measure.key,
          head: measure.head,
          title: measure.label,
          width: FIGURE_WIDTH,
          cell: (line: PlayerStatLine) => {
            const value = measure.read(line, besideOf(line, statsLeague, defcon));
            // A dash where he has no reading; a played nought is a figure like any other, in ink, ours in cyan.
            const ink =
              value === null
                ? "text-faint"
                : measure.derived
                  ? "text-info"
                  : standoutInk(value, cuts.get(measure.key), measure.worse ? "low" : "high") || "text-ink";
            return { value: value === null ? DASH : value, className: ink };
          },
        }))}
      />

      <BoardKey entries={measures.map((measure) => ({ label: measure.head, title: measure.label }))} />
    </section>
  );
}
