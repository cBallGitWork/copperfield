import type { FootballPlayer } from "@epl/core";
import type { PoolRow } from "./pool";
import { type PoolColumn } from "./columns";
import type { StandoutCut } from "../components/league/standout";
import { activeSort, sortHref } from "./query";
import type { PlayersQuery } from "./query";
import type { BoardView } from "./views";
import Board from "../components/league/Board";
import { figureCell, Lead } from "./Cell";
import { doubtRow } from "../components/football/doubtRow";

// The pool as one sortable board: every column, phone-first, each sort a link so the server orders and the URL keeps it.
// Under a thumb each man is two lines, his name held still over figures that scroll sideways with the head (Fantrax's
// row, Craig 16 Oct 2026); the desk keeps one line, the name pinned and CM's position tile down the left.

export default function PlayerTable({
  rows,
  columns,
  query,
  view,
  teamNames,
  reader,
  raw,
  rated,
  cuts,
  footballers,
}: {
  rows: readonly PoolRow[];
  /** The columns this plate shows, worked out by the page so the cuts are taken over exactly these. */
  columns: readonly PoolColumn[];
  query: PlayersQuery;
  view: BoardView;
  teamNames: Map<string, string>;
  /** The reader's own team, so his players read "Yours"; null for a reader with no team. */
  reader: string | null;
  /** The grouped payload's raw counts, by Fantrax id. */
  raw: Map<string, Record<string, number | null>>;
  /** Whether the counts are drawn per ninety minutes. */
  rated: boolean;
  /** Each lit column's cuts, by key. */
  cuts: Map<string, StandoutCut>;
  /** FPL's players by code, for whether each man can play. */
  footballers: ReadonlyMap<number, FootballPlayer>;
}) {
  const current = activeSort(query, view);
  // Each row's footballer, for its wash and the lead's mark and note.
  const footballer = (row: PoolRow) => (row.fplCode === null ? null : (footballers.get(row.fplCode) ?? null));
  const wash = (row: PoolRow) => doubtRow(footballer(row));
  return (
    <Board
      compact
      rows={rows}
      keyOf={(row) => row.entry.player.fantraxId}
      rowClass={wash}
      lead={{
        tile: { positions: (row) => row.entry.eligiblePositions, free: (row) => row.entry.ownerTeamId === null, deskOnly: true },
        name: {
          label: "Player",
          className: wash,
          of: (row) => <Lead row={row} query={query} teamNames={teamNames} reader={reader} footballer={footballer(row)} />,
          line: (row) => <Lead row={row} query={query} teamNames={teamNames} reader={reader} footballer={footballer(row)} line />,
        },
      }}
      order={{ key: current.column.key, descending: current.descending, href: (key) => sortHref(query, key, view) }}
      columns={columns
        .filter((column) => column.key !== "name")
        .map((column) => ({
          key: column.key,
          head: column.label,
          title: column.title,
          cell: (row: PoolRow) => figureCell(column, row, raw.get(row.entry.player.fantraxId), rated, cuts.get(column.key)),
        }))}
    />
  );
}
