import type { CSSProperties } from "react";
import { type LeagueTeam, type LineupDetail, type ScoringCategory, type SquadPlayerDetail, crestUrl, fullPlayerName, inkOn, wordsOf } from "@epl/core";
import { teamColours } from "@/app/teamColours";
import Section from "../../../components/shell/Section";
import Board from "../../../components/league/Board";
import LeadFace, { LEAD_LINK } from "../../../components/league/LeadFace";
import { gainOrLoss } from "@/app/desk";
import { MaybeCard } from "../../../prem/match/[id]/PlayerCardButton";
import { figureOf, paidIn, sideRows, type Breakdowns, type Counts } from "./sideRows";
import { DEFAULT_SIDE_SORT } from "./views";
import Absent from "@/app/components/shell/Absent";

// One manager's fifteen in the match page's club board (`prem/match/[id]/ClubStats`): his colours on the
// position tiles, each man's club crest, Fantrax's points, then what he did in each of the league's categories.

/** A man on the board, and whether he sat on the bench, which is not counted and so neither gains nor loses. */
interface Row {
  player: SquadPlayerDetail;
  reserve: boolean;
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

  return (
    <Section>
      <Board
        className="cm-index-scoped"
        style={managerIndex(team)}
        rows={eleven.map((player) => ({ player, reserve: false }))}
        tail={{ label: "Bench · not counted", rows: bench.map((player) => ({ player, reserve: true })) }}
        keyOf={({ player }) => player.rostered.slot.fantraxId}
        rowClass={({ reserve }) => (reserve ? "cm-out" : "")}
        lead={{
          tile: { positions: ({ player }) => (player.rostered.slot.position ? [player.rostered.slot.position] : []) },
          name: {
            label: "Player",
            of: ({ player }) => (
              <MaybeCard player={player} className={`${LEAD_LINK} gap-1.5`}>
                <LeadFace crest={player.club ? crestUrl(player.club) : null} name={fullPlayerName(player.rostered)} />
              </MaybeCard>
            ),
          },
        }}
        order={{ key: sort.head, descending: sort.descending, href: hrefFor }}
        columns={heads.map((head) => ({
          key: head.code,
          head: wordsOf(head).head,
          title: wordsOf(head).key,
          cell: ({ player, reserve }: Row) => {
            const value = figureOf(player, head.code, counts);
            // A gain green and a loss red, as his breakdown card prints them (DESIGN §3's direction pair).
            const paid = reserve || value === null ? 0 : paidIn(breakdown, player, head.code);
            const bold = !reserve && head.code === DEFAULT_SIDE_SORT ? "font-bold" : "";
            return { value: value === null ? <Absent /> : value, className: `${bold} ${gainOrLoss(paid)}` };
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
