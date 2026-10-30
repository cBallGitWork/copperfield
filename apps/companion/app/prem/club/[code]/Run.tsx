import type { ReactNode } from "react";
import ScrollBoard from "../../../components/league/ScrollBoard";
import Link from "@/app/components/shell/Link";
import type { Club, CupTie, Fixture, RunEntry, SeasonOrder } from "@epl/core";
import { COMPETITION_NAME, cupName, kickoffAt, londonDayAndDate, londonTime, DASH } from "@epl/core";
import { clubHref } from "../../routes";
import { BOARD, DESK_ONLY, FIGURE, MINOR_CAPS, MINOR_LABEL, ROW_HOVER, ROW_NAME, TAP_ROW } from "@/app/desk";
import { IndexCell, ROW_LINK } from "../../../components/league/TableCells";
import Absent from "@/app/components/shell/Absent";
import ClubLabel from "@/app/components/football/ClubLabel";
import Scoreline from "../../../components/shell/Scoreline";
import { matchHref } from "../../match/[id]/matchRoutes";
import { hasScore } from "../../score";

// One club's season, league and cups, opened on the next match (`runOrder`): a date, the opponent once, H/A, the competition, the score.
// A live score keeps its ink: a running score with no tense reads as a final one. A league row is one link, to its match.

interface Cells {
  key: string;
  kickoff: string | null;
  opponent: ReactNode;
  venue: "H" | "A" | "N";
  competition: ReactNode;
  score: ReactNode;
}

export default function Run({
  order,
  club,
  clubs,
  byCode,
}: {
  /** To come, then played under one "Played" row. */
  order: SeasonOrder<RunEntry>;
  /** Whose season this is — the side that is NOT named on each row. */
  club: Club;
  clubs: Map<number, Club>;
  /** FPL's clubs by code, for a cup tie between two of them. */
  byCode: Map<number, Club>;
}) {
  return (
    <ScrollBoard>
      <table className={BOARD}>
        <caption className="sr-only">{club.name}&apos;s season, the next match first, then the played, newest first</caption>
        <tbody>
          {order.toCome.map((entry) => runRow(entry, club, clubs, byCode))}
          {order.played.length === 0 ? null : (
            <tr>
              <td colSpan={6} className={`${MINOR_LABEL} px-1.5 pb-1 pt-3`}>
                Played
              </td>
            </tr>
          )}
          {order.played.map((entry) => runRow(entry, club, clubs, byCode))}
        </tbody>
      </table>
    </ScrollBoard>
  );
}

function runRow(entry: RunEntry, club: Club, clubs: Map<number, Club>, byCode: Map<number, Club>) {
  const row = entry.kind === "league" ? leagueCells(entry.fixture, club, clubs) : cupCells(entry.tie, byCode);
  return (
    // `relative` holds a league row's link, stretched over every cell.
    <tr key={row.key} className={`cm-row relative ${ROW_HOVER}`}>
      {/* The date in the club's own colour: `ClubShell` scopes `--cm-index` to this club. */}
      <IndexCell wide width="" className="whitespace-nowrap">{kickoffAt(row.kickoff, londonDayAndDate)}</IndexCell>
      <td className="numeric whitespace-nowrap px-1 text-xs text-faint">
        {row.kickoff === null ? "" : londonTime(row.kickoff)}
      </td>
      <td className="w-full max-w-0 px-1">{row.opponent}</td>
      <td className="px-1 text-center text-2xs font-bold text-muted">{row.venue}</td>
      <td className={`${DESK_ONLY} whitespace-nowrap px-1.5 text-2xs text-faint`}>{row.competition}</td>
      <td className={`${FIGURE} w-14 whitespace-nowrap`}>{row.score}</td>
    </tr>
  );
}

/** A league fixture: the whole row opens the match, through the opponent's link stretched over it. */
function leagueCells(fixture: Fixture, club: Club, clubs: Map<number, Club>): Cells {
  const home = fixture.homeClubId === club.id;
  const opponent = clubs.get(home ? fixture.awayClubId : fixture.homeClubId);
  const played = hasScore(fixture);
  // The club's own goals first, whichever end it was at.
  const mine = home ? fixture.homeScore : fixture.awayScore;
  const theirs = home ? fixture.awayScore : fixture.homeScore;
  return {
    key: `league-${fixture.id}`,
    kickoff: fixture.kickoff,
    opponent: (
      <Link href={matchHref(fixture.id, "overview")} className={`${ROW_LINK} after:absolute after:inset-0`}>
        {opponent === undefined ? (
          <span className="text-sm text-faint">{DASH}</span>
        ) : (
          <ClubLabel club={opponent} crest={{ px: CREST_PX, className: `${CREST} object-contain` }} />
        )}
      </Link>
    ),
    venue: home ? "H" : "A",
    competition: COMPETITION_NAME,
    score: !played ? (
      <Absent />
    ) : (
      <span className={fixture.status === "live" ? "text-live" : undefined}>
        <Scoreline home={mine} away={theirs} />
      </span>
    ),
  };
}

/** A cup or European tie: no match page behind it, and on a phone its competition under the opponent. */
function cupCells(tie: CupTie, byCode: Map<number, Club>): Cells {
  const competition = cupName(tie.competition);
  const opponent = tie.opponentCode === null ? undefined : byCode.get(tie.opponentCode);
  const marker = <span className={`${MINOR_CAPS} min-w-0 truncate text-faint lg:hidden`}>{competition ?? DASH}</span>;
  return {
    key: `cup-${tie.competition}-${tie.kickoff}-${tie.opponentCode ?? tie.opponentName}`,
    kickoff: tie.kickoff,
    opponent:
      opponent === undefined ? (
        // No crest to draw, so its room is kept and the names stay in one column.
        <span className={`${TAP_ROW} gap-2`}>
          <span className={CREST} aria-hidden />
          <span className="flex min-w-0 flex-col">
            <span className={`min-w-0 truncate ${ROW_NAME}`}>{tie.opponentName ?? DASH}</span>
            {marker}
          </span>
        </span>
      ) : (
        // On a phone the crest stands beside both lines, the name over the competition.
        <Link
          href={clubHref(opponent.code)}
          className="cm-row grid min-h-9 grid-cols-[auto_minmax(0,1fr)] content-center items-center gap-x-2 hover:underline lg:flex lg:gap-2"
        >
          <ClubLabel club={opponent} crest={{ px: CREST_PX, className: `${CREST} row-span-2 object-contain` }} />
          {marker}
        </Link>
      ),
    venue: tie.neutral ? "N" : tie.home ? "H" : "A",
    competition: competition ?? <Absent />,
    score: tie.score === null ? <Absent /> : <Scoreline home={tie.score.for} away={tie.score.against} />,
  };
}

/** The crest beside a fixture in this run: 22px at both widths; `_PX` is what `next/image` fetches. */
const CREST = "h-[1.375rem] w-[1.375rem] shrink-0";
const CREST_PX = 22;
