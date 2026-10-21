import type { CSSProperties } from "react";
import { type LeagueTeam, type LineupDetail, type ScoringCategory, type SquadPlayerDetail, crestUrl, fullPlayerName, inkOn, isResolved, wordsOf } from "@epl/core";
import { teamColours } from "@/app/teamColours";
import Section from "../../../components/shell/Section";
import Board from "../../../components/league/Board";
import LeadFace, { LEAD_LINK } from "../../../components/league/LeadFace";
import { gainOrLoss } from "@/app/desk";
import { MaybeCard } from "../../../components/league/PlayerCardButton";
import { figureOf, paidIn, sideRows, type Breakdowns, type Counts } from "./sideRows";
import { DEFAULT_SIDE_SORT } from "./views";
import Absent from "@/app/components/shell/Absent";
import { fitnessOf } from "../../../components/football/doubtRow";
import FitnessMark from "../../../components/football/FitnessMark";

// One manager's fifteen in the match page's club board (`prem/match/[id]/ClubStats`): his colours on the
// position tiles, each man's club crest and CM's mark, Fantrax's points in cyan, then what he did in each category.

/** A man on the board, and whether he sat on the bench, which is not counted and so neither gains nor loses. */
interface Row {
  player: SquadPlayerDetail;
  reserve: boolean;
  fitness: ReturnType<typeof fitnessOf>;
}

/** A man's row, asking his fitness once for the wash and the mark. */
function rowOf(player: SquadPlayerDetail, reserve: boolean): Row {
  return { player, reserve, fitness: fitnessOf(isResolved(player.rostered) ? player.rostered.player : null) };
}

export default function SideStats({
  team,
  sheet,
  columns,
  counts,
  breakdown,
  sort,
  hrefFor,
}: {
  team: LeagueTeam;
  sheet: LineupDetail;
  columns: readonly ScoringCategory[];
  counts: Counts;
  /** What Fantrax paid each man in each category, which inks his figure. */
  breakdown: Breakdowns;
  sort: { head: string; descending: boolean };
  /** The same board ordered by one column, with that column's default direction. */
  hrefFor: (head: string) => string;
}) {
  const { eleven, bench } = sideRows(sheet, counts, sort);
  const heads = [{ code: DEFAULT_SIDE_SORT, name: "Fantasy points", longCode: null }, ...columns];
  // Fantrax's own points: the one cyan figure column, headed as every other board heads it (DESIGN §3).
  const wordsAt = (head: ScoringCategory) => (head.code === DEFAULT_SIDE_SORT ? { head: "FPts", key: head.name } : wordsOf(head));

  return (
    <Section>
      <Board
        className="cm-index-scoped"
        style={managerIndex(team)}
        rows={eleven.map((player) => rowOf(player, false))}
        tail={{ label: "Bench · not counted", rows: bench.map((player) => rowOf(player, true)) }}
        keyOf={({ player }) => player.rostered.slot.fantraxId}
        rowClass={({ reserve, fitness }) => `${reserve ? "cm-out" : ""} ${fitness.wash}`}
        lead={{
          tile: { positions: ({ player }) => (player.rostered.slot.position ? [player.rostered.slot.position] : []) },
          name: {
            label: "Player",
            className: ({ fitness }) => fitness.wash,
            of: ({ player, fitness }) => (
              <MaybeCard player={player} className={`${LEAD_LINK} gap-1.5`}>
                <LeadFace
                  crest={player.club ? crestUrl(player.club) : null}
                  name={fullPlayerName(player.rostered)}
                  after={<FitnessMark mark={fitness.mark} />}
                />
              </MaybeCard>
            ),
          },
        }}
        order={{ key: sort.head, descending: sort.descending, href: hrefFor }}
        columns={heads.map((head) => ({
          key: head.code,
          head: wordsAt(head).head,
          title: wordsAt(head).key,
          cell: ({ player, reserve }: Row) => {
            const value = figureOf(player, head.code, counts);
            if (value === null) return { value: <Absent />, className: "" };
            if (head.code === DEFAULT_SIDE_SORT) return { value, className: "text-info" };
            // A gain green and a loss red, as his breakdown card prints them (DESIGN §3's direction pair).
            return { value, className: gainOrLoss(reserve ? 0 : paidIn(breakdown, player, head.code)) };
          },
        }))}
      />
    </Section>
  );
}

/** CM's index block in the manager's colours, with the ink that reads on them (`cm-index-scoped` keeps the contrast). */
function managerIndex(team: LeagueTeam): CSSProperties {
  const colours = teamColours(team.teamId);
  return { "--cm-index": colours.primary, "--cm-index-ink": inkOn(colours) } as CSSProperties;
}
