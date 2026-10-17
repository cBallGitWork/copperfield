import Link from "@/app/components/shell/Link";
import { DASH, type FigureKind, fixed } from "@epl/core";
import ClubLabel from "../../components/football/ClubLabel";
import Board, { type BoardColumn, type BoardFigure } from "../../components/league/Board";
import { standoutCuts, standoutInk, type StandoutCut } from "../../components/league/standout";
import Section from "../../components/shell/Section";
import { matchHref } from "../../prem/match/[id]/matchRoutes";
import { RATING_TITLE } from "../../ratings";
import type { MatchRow } from "./matchRows";

// Every match of his season on the house board (Craig, 25 Sep 2026): his points first (Craig, 12 Oct 2026), then the
// score, FPL's account, Fantrax's right of the rule, our mark last in the derived cyan.

interface Column {
  head: string;
  title: string;
  of: (row: MatchRow) => number | null;
  /** Decimal places, for the expected figures. */
  kind?: FigureKind;
  /** A rule before the column: the start of the match's account, of Fantrax's, of our mark. */
  rule?: boolean;
  /** Ours rather than recorded: cyan, and never lit as a standout. */
  derived?: boolean;
}

const POINTS: Column = { head: "FPts", title: "Points", of: (r) => r.paid?.points ?? null };

const COLUMNS: readonly Column[] = [
  { head: "Min", title: "Minutes played", of: (r) => r.fpl.match.minutes },
  { head: "G", title: "Goals", of: (r) => r.fpl.match.goals },
  { head: "A", title: "Assists", of: (r) => r.fpl.match.assists },
  // 1 or 0 where he played: a keeper who conceded has a reading (zero is a stat), a man not on has none.
  { head: "CS", title: "Clean sheet", of: (r) => (r.fpl.match.minutes > 0 ? Number(r.fpl.match.cleanSheet) : null) },
  { head: "Sv", title: "Saves", of: (r) => r.fpl.match.saves },
  { head: "xG", title: "Expected goals", of: (r) => r.fpl.match.expectedGoals, kind: "expected" },
  { head: "xA", title: "Expected assists", of: (r) => r.fpl.match.expectedAssists, kind: "expected" },
  { head: "DC", title: "DefCon", of: (r) => r.fpl.match.defensiveContribution },
  { head: "Sh", title: "Shots", of: (r) => r.paid?.shots ?? null, rule: true },
  { head: "SoT", title: "Shots on target", of: (r) => r.paid?.shotsOnTarget ?? null },
  { head: "FC", title: "Fouls committed", of: (r) => r.paid?.foulsCommitted ?? null },
  { head: "FS", title: "Fouls suffered", of: (r) => r.paid?.foulsSuffered ?? null },
  { head: "Off", title: "Offsides", of: (r) => r.paid?.offsides ?? null },
  { head: "Rtg", title: RATING_TITLE, of: (r) => r.mark, kind: "rating", rule: true, derived: true },
];

/** A column's standouts over his matches: its best in orange, its top quarter in yellow. */
const SHARES = { good: 0.25, best: 0.1 };

export default function MatchLog({ rows }: { rows: readonly MatchRow[] }) {
  if (rows.length === 0) {
    return (
      <Section title="Every match">
        <p className="text-sm text-muted">No match he has played yet this season.</p>
      </Section>
    );
  }

  const drawn = measured(rows);
  const cuts = new Map<string, StandoutCut>(
    [POINTS, ...drawn].map((column) => [column.head, standoutCuts(rows.map(column.of), SHARES, { of: rows.length })]),
  );
  const columns: BoardColumn<MatchRow>[] = [
    figureColumn(POINTS, cuts),
    { key: "res", head: "Res", title: "The score, from his club's point of view — tap it for the match", rule: true, cell: (row) => score(row.fpl) },
    ...drawn.map((column) => figureColumn(column, cuts)),
  ];

  return (
    <Section title="Every match">
      <Board
        rows={rows}
        keyOf={(row) => `${row.fpl.match.gameweek}-${row.fpl.match.fixtureId}`}
        lead={{
          index: { label: "Gameweek", of: (row) => row.fpl.match.gameweek },
          name: {
            label: "Opponent",
            of: (row) => (
              <span className="cm-row flex items-center gap-1.5 px-1.5">
                {row.fpl.opponent ? <ClubLabel club={row.fpl.opponent} /> : DASH}
                <span className="text-2xs text-faint">{row.fpl.match.home ? "H" : "A"}</span>
              </span>
            ),
          },
        }}
        columns={columns}
      />
    </Section>
  );
}

/** The columns some match of his measured, a stood-down column's rule passing to the next: Fantrax's keeper table
 *  has no shots or offsides at all. */
function measured(rows: readonly MatchRow[]): Column[] {
  let rule = false;
  return COLUMNS.flatMap((column) => {
    rule ||= Boolean(column.rule);
    if (!rows.some((row) => column.of(row) !== null)) return [];
    const drawn = { ...column, rule };
    rule = false;
    return [drawn];
  });
}

/** A figure column on the board, lit against its own standouts. */
function figureColumn(column: Column, cuts: ReadonlyMap<string, StandoutCut>): BoardColumn<MatchRow> {
  return {
    key: column.head,
    head: column.head,
    title: column.title,
    rule: column.rule,
    cell: (row: MatchRow) => figure(column, column.of(row), cuts.get(column.head)),
  };
}

/** One figure, centred, lit when it stands out; a dash where nobody measured it. */
function figure(column: Column, value: number | null, cut: StandoutCut | undefined): BoardFigure {
  const shown = value === null ? DASH : column.kind ? fixed(value, column.kind) : value;
  const ink = value === null ? "text-faint" : column.derived ? "text-info" : standoutInk(value, cut, "high") || (value === 0 ? "text-muted" : "");
  return { value: shown, className: `font-bold ${ink}` };
}

/** The score his way round, green for a win and red for a loss, and a way into the match. */
function score(row: MatchRow["fpl"]): BoardFigure {
  const { match } = row;
  const result = match.scored > match.conceded ? "won" : match.scored < match.conceded ? "lost" : "drew";
  const ink = result === "lost" ? "text-bad" : result === "won" ? "text-up" : "text-muted";
  return {
    className: `font-bold ${ink}`,
    value: (
      // A tappable score is a control, so it takes the control floor: 44 under a thumb, 36 on a desk.
      <Link href={matchHref(match.fixtureId, "overview")} className="flex min-h-11 items-center justify-center hover:underline lg:min-h-9">
        <span className="sr-only">{`${result} `}</span>
        {match.scored}–{match.conceded}
      </Link>
    ),
  };
}
