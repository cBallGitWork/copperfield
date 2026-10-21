import Link from "@/app/components/shell/Link";
import { DASH, fixed, ordinal, type Ranked } from "@epl/core";
import ClubLabel from "../../components/football/ClubLabel";
import Board, { type BoardColumn, type BoardFigure } from "../../components/league/Board";
import { standoutCuts, standoutInk, type StandoutCut } from "../../components/league/standout";
import Section from "../../components/shell/Section";
import { matchHref } from "../../prem/match/[id]/matchRoutes";
import type { MatchRow } from "./matchRows";
import { POINTS, columnsFor, totalOf, type MatchColumn } from "./matchColumns";
import { TAP_ROW } from "@/app/desk";

// Every match of his season on the house board (Craig, 25 Sep 2026): his points first (Craig, 12 Oct 2026), then the
// score, FPL's account, Fantrax's right of the rule, our mark last in the derived cyan. His season's Total and his Rank
// among his group stand at its foot (Craig, 21 Oct 2026: Rankings folded in).

/** The foot's two rows, under the matches. */
const FOOT = ["Total", "Rank"] as const;
type Foot = (typeof FOOT)[number];
type Line = MatchRow | Foot;

const isFoot = (row: Line): row is Foot => typeof row === "string";

/** His season placed among his group, from `playerStanding`. */
export interface Standing {
  ranked: readonly Ranked[];
  /** His league points placed among the same men; null where the pool is silent or a projection. */
  fpts: Ranked | null;
  group: string | null;
  keeper: boolean;
}

/** A column's standouts over his matches: its best in orange, its top quarter in yellow. */
const SHARES = { good: 0.25, best: 0.1 };

export default function MatchLog({ rows, standing }: { rows: readonly MatchRow[]; standing: Standing }) {
  const field = standing.ranked[0]?.of ?? 0;
  const ranks = new Map((field === 0 ? [] : [...(standing.fpts ? [standing.fpts] : []), ...standing.ranked]).map((r) => [r.head, r]));
  const drawn = columnsFor(rows, standing.keeper, [...ranks.values()]);
  if (rows.length === 0 && ranks.size === 0) {
    return (
      <Section title="Every match">
        <p className="text-sm text-muted">No match he has played yet this season.</p>
      </Section>
    );
  }

  const cuts = new Map<string, StandoutCut>(
    [POINTS, ...drawn].map((column) => [column.head, standoutCuts(rows.map(column.of), SHARES, { of: rows.length })]),
  );
  const figures = (column: MatchColumn) => figureColumn(column, rows, cuts.get(column.head), ranks.get(column.head));
  const columns: BoardColumn<Line>[] = [
    figures(POINTS),
    {
      key: "res",
      head: "Res",
      title: "The score, from his club's point of view — tap it for the match",
      rule: true,
      cell: (row) => (isFoot(row) ? { value: "" } : score(row.fpl)),
    },
    ...drawn.map(figures),
  ];

  return (
    <Section title="Every match" aside={field === 0 ? undefined : `Ranked among ${field} ${standing.group ?? "players"}`}>
      <Board<Line>
        rows={rows}
        keyOf={(row) => (isFoot(row) ? row : `${row.fpl.match.gameweek}-${row.fpl.match.fixtureId}`)}
        tail={{ label: "Season", rows: FOOT }}
        lead={{
          index: { label: "Gameweek", of: (row) => (isFoot(row) ? "" : row.fpl.match.gameweek) },
          name: {
            label: "Opponent",
            of: (row) => (
              <span className="cm-row flex items-center gap-1.5 px-1.5">
                {isFoot(row) ? row : row.fpl.opponent ? <ClubLabel club={row.fpl.opponent} /> : DASH}
                {isFoot(row) ? null : <span className="text-2xs text-faint">{row.fpl.match.home ? "H" : "A"}</span>}
              </span>
            ),
          },
        }}
        columns={columns}
      />
    </Section>
  );
}

/** A figure column on the board: each match lit against its own standouts, then his season's total and place. */
function figureColumn(column: MatchColumn, rows: readonly MatchRow[], cut: StandoutCut | undefined, rank: Ranked | undefined): BoardColumn<Line> {
  return {
    key: column.head,
    head: column.head,
    title: column.title,
    rule: column.rule,
    cell: (row: Line) =>
      row === "Total"
        ? total(column, totalOf(column, rows, rank))
        : row === "Rank"
          ? place(rank)
          : figure(column, column.of(row), cut),
  };
}

/** One figure, centred, lit when it stands out; a dash where nobody measured it. */
function figure(column: MatchColumn, value: number | null, cut: StandoutCut | undefined): BoardFigure {
  const ink = value === null ? "" : column.derived || column.cyan ? "text-info" : standoutInk(value, cut, "high") || (value === 0 ? "text-muted" : "");
  return total(column, value, ink);
}

/** A figure as its column prints it, never lit: the season's line reads in ink, ours in cyan. */
function total(column: MatchColumn, value: number | null, ink = column.derived || column.cyan ? "text-info" : ""): BoardFigure {
  if (value === null) return { value: DASH, className: "font-bold text-faint" };
  return { value: column.kind ? fixed(value, column.kind) : value, className: `font-bold ${ink}` };
}

/** His place in the group: top in CM's orange, its top tenth in amber, the rest in ink; a dash where unranked. */
function place(rank: Ranked | undefined): BoardFigure {
  if (rank === undefined || rank.rank === null) return { value: DASH, className: "font-bold text-faint" };
  const ink = rank.rank === 1 ? "text-peak" : rank.rank <= Math.max(3, Math.ceil(rank.of / 10)) ? "text-mid" : "";
  return { value: ordinal(rank.rank), className: `font-bold ${ink}`, title: `${ordinal(rank.rank)} of ${rank.of}` };
}

/** The score his way round, green for a win and red for a loss, and a way into the match. */
function score(row: MatchRow["fpl"]): BoardFigure {
  const { match } = row;
  const result = match.scored > match.conceded ? "won" : match.scored < match.conceded ? "lost" : "drew";
  const ink = result === "lost" ? "text-bad" : result === "won" ? "text-up" : "text-muted";
  return {
    className: `font-bold ${ink}`,
    value: (
      // A tappable score makes its row a tap row: 44 under a thumb, the desk's 28.
      <Link href={matchHref(match.fixtureId, "overview")} className={`${TAP_ROW} justify-center hover:underline`}>
        <span className="sr-only">{`${result} `}</span>
        {match.scored}–{match.conceded}
      </Link>
    ),
  };
}
