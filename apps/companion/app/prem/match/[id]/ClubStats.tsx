import { fixed, fullFootballerName, loggedPlayers } from "@epl/core";
import { clubIndex } from "../../../components/football/clubIndex";
import type { Club, PlManMatch, PlTeamSheet, SquadPlayerDetail } from "@epl/core";
import { fantraxPositions, type LeagueOpinion } from "../../leagueOpinions";
import Section from "../../../components/shell/Section";
import Board from "../../../components/league/Board";
import LeadFace, { LEAD_LINK } from "../../../components/league/LeadFace";
import { MaybeCard } from "./PlayerCardButton";
import SubNote from "./SubNote";
import { COLUMNS, sorted, type StatLine, type StatSort } from "./statColumns";
import { SIDE_SHARES, standoutCuts, standoutInk } from "../../../components/league/standout";
import { statsHref } from "./statsSort";
import { appeared, cameOn, forCode, ordered, type Named } from "./sheetJoin";
import type { Match } from "./match";
import { MATCH_ROW } from "./matchRow";
import Absent from "@/app/components/shell/Absent";

// One club's men and what each did — CM 01/02's `Roma Stats` foot screen, ranked by fantasy points.

interface Row extends StatLine {
  named: Named;
}

export default function ClubStats({
  match,
  side,
  club,
  sheet,
  events,
  injured,
  league,
  cards,
  sort,
  descending,
}: {
  match: Match;
  side: "home" | "away";
  club: Club | undefined;
  sheet: PlTeamSheet;
  events: Map<number, PlManMatch>;
  injured: ReadonlyMap<number, number>;
  /** Our league's view of each man, by FPL code: his eligibility and his Fantrax id. */
  league: ReadonlyMap<number, LeagueOpinion>;
  /** Each man's player card, by FPL code. */
  cards: ReadonlyMap<number, SquadPlayerDetail>;
  sort: StatSort;
  descending: boolean;
}) {
  const logged = loggedPlayers(match.logged);
  const lines = new Map((match.sheet?.lines ?? []).map((line) => [line.playerId, line]));
  // Ties keep the sheet's order, with the bench's men who got on above the ones who sat.
  const onSheet = ordered(sheet, events);
  const inSheetOrder = [
    ...onSheet.filter((row) => !row.bench),
    ...onSheet.filter((row) => row.bench && cameOn(row)),
    ...onSheet.filter((row) => row.bench && !cameOn(row)),
  ].map((row): Row => {
    const id = forCode(match.byCode, row.man.code)?.id;
    return {
      named: row,
      line: id === undefined ? undefined : lines.get(id),
      stats: id === undefined ? undefined : match.figures.get(id),
      logged: forCode(logged, row.man.code),
    };
  });
  const rows = sorted(inSheetOrder, sort, descending);
  const appearances = inSheetOrder.filter((row) => appeared(row.named));
  const cuts = new Map(
    COLUMNS.filter((column) => "rank" in column).map((column) => {
      const values = appearances.map((row) => column.of(row));
      return [column.head, standoutCuts(values, SIDE_SHARES, { of: appearances.length })];
    }),
  );
  // Grey is "not on the pitch at the whistle", the team sheet's own rule.
  const finished = (row: Row) => appeared(row.named) && row.named.did?.offAt == null;

  return (
    <Section>
      <Board
        className="cm-index-scoped"
        style={clubIndex(club)}
        rows={rows}
        keyOf={(row, at) => `${row.named.man.code ?? row.named.man.name}-${at}`}
        rowClass={(row) => (finished(row) ? "" : "cm-out")}
        rowAttrs={MATCH_ROW}
        lead={{
          tile: { positions: (row) => fantraxPositions(league, row.named.man.code) },
          name: {
            label: "Player",
            of: (row) => {
              const { man, did } = row.named;
              const hurt = man.code !== null && injured.has(man.code);
              return (
                // His card, not his page: every name on a match screen opens the same card (Craig, 23 Sep 2026).
                <MaybeCard player={forCode(cards, man.code)} className={`${LEAD_LINK} ${PHONE_ROW} gap-1.5`}>
                  <LeadFace
                    name={footballerName(match, man)}
                    after={
                      <>
                        {man.captain ? <span className="shrink-0 text-2xs text-faint">(c)</span> : null}
                        <SubNote onAt={did?.onAt} offAt={did?.offAt} added={did?.added} hurt={hurt} className="hidden lg:inline" />
                      </>
                    }
                  />
                </MaybeCard>
              );
            },
          },
        }}
        order={{
          key: sort,
          descending,
          href: (key) => statsHref(match.fixture.id, side, key as StatSort, sort, descending),
        }}
        columns={COLUMNS.map((column) => ({
          key: column.head,
          head: column.head,
          title: column.title,
          cell: (row: Row) => {
            const value = column.of(row);
            const played = appeared(row.named);
            const kind = ("kind" in column ? column.kind : undefined) ?? "count";
            const ink =
              !played || value === null
                ? ""
                : "rank" in column
                  ? standoutInk(value, cuts.get(column.head), column.rank)
                  : "derived" in column
                    ? "font-bold text-info"
                    : "";
            return { value: value === null || !played ? <Absent /> : fixed(value, kind), className: ink };
          },
        }))}
      />
    </Section>
  );
}

/** 36px under a thumb, not 44: PRODUCT's match-screen exception, which `MATCH_ROW` marks. */
const PHONE_ROW = "max-lg:min-h-9";

/** His name in full by the one rule, or the team sheet's where FPL does not know him. */
function footballerName(match: Match, man: { code: number | null; name: string }): string {
  const footballer = forCode(match.byCode, man.code);
  return footballer === undefined ? man.name : fullFootballerName(footballer);
}
