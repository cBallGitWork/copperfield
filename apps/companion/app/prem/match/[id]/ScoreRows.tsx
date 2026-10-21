import { DASH, fullFootballerName } from "@epl/core";
import type { FootballPlayer, PlGoalGroup, SquadPlayerDetail } from "@epl/core";
import { MaybeCard } from "../../../components/league/PlayerCardButton";
import { forCode } from "./sheetJoin";
import LeagueHolder from "../../LeagueHolder";
import type { Holders } from "../../holders";
import PlayerName from "../../../components/shell/PlayerName";
import EventIcon from "../../../components/football/EventIcon";
import type { EventGlyph } from "../../../components/football/EventIcon";
import { SMALL_CAPS } from "@/app/desk";

// One scorer's line and one other man's line on the scoresheet, set at CM's size (see `Scoresheet`).

const NAME = "font-chrome text-lg font-bold lg:text-3xl";
/** A phone floats the minute at the head of the name's block, so a long name's second line runs under it; a desk sets it last. */
const FIGURE = "numeric shrink-0 font-bold text-accent max-lg:float-right max-lg:ml-1.5 lg:order-last lg:ml-auto lg:pl-3";
const SCORER_FIGURE = `${FIGURE} text-lg lg:text-3xl`;
/** The assister's minutes: the scorer's ink and column, at the assister's size. */
const ASSIST_FIGURE = `${FIGURE} text-sm lg:text-xl`;
/** A phone wraps the name at a space only (never 'Sesseg/non'); a desk keeps its width and cuts it. */
const KEEPS_WIDTH = "lg:max-w-full lg:shrink-0 lg:truncate";
/** The holder's bracket, at the scoresheet's size: whole on whichever line has room for it on a phone, cut first on a desk. */
const GIVES_WAY = "whitespace-nowrap lg:min-w-0 lg:truncate lg:text-base";
/** The name, its bracket and the minute; at most two lines on a phone, so the owner drops out before a third. */
const NAME_BLOCK = "min-w-0 flex-1 max-lg:max-h-[2lh] max-lg:overflow-hidden lg:flex lg:items-baseline";

/** One scorer with all his minutes, and under him the men who made them, in the order the goals came. */
export function Goal({
  group,
  holders,
  byCode,
  cards,
}: {
  group: PlGoalGroup;
  holders: Holders;
  byCode: Map<number, FootballPlayer>;
  cards: ReadonlyMap<number, SquadPlayerDetail>;
}) {
  const scorer = forCode(byCode, group.scorer);

  return (
    <li>
      <Man
        code={group.scorer}
        card={forCode(cards, group.scorer)}
        name={scorer?.name ?? DASH}
        short={scorer === undefined ? DASH : fullFootballerName(scorer)}
        holders={holders}
        figure={minutes(group.minutes)}
        note={group.own ? "og" : null}
        glyph="ball"
      />
      {group.assisters.map(({ code, minutes: his }) => {
        const assister = byCode.get(code);
        if (assister === undefined) return null;
        // His minutes, unless he made every one of this scorer's goals and they would only repeat the line above.
        const paired = his.length !== group.minutes.length;
        return (
          <MaybeCard
            key={code}
            player={cards.get(code)}
            // On its row's top edge, under the scorer; the rest of its 36px falls below, before the next goal.
            className="flex min-h-9 w-full items-baseline gap-1.5 pl-3 text-left hover:underline lg:pl-4"
          >
            <span className={`${SMALL_CAPS} shrink-0 text-faint`}>A</span>
            <span className={`${NAME_BLOCK} font-chrome text-sm font-bold text-muted lg:text-xl`}>
              {paired ? <span className={ASSIST_FIGURE}>{minutes(his)}</span> : null}
              <span className={KEEPS_WIDTH}>
                <PlayerName name={assister.name} short={fullFootballerName(assister)} />
              </span>{" "}
              <LeagueHolder code={code} holders={holders} className={`lg:ml-1 ${GIVES_WAY}`} />
            </span>
          </MaybeCard>
        );
      })}
    </li>
  );
}

/** A name and the figure beside it, the shape both a goal and a leftover mark take. */
export function Man({
  code,
  card,
  name,
  short = name,
  holders,
  figure,
  note = null,
  glyph = null,
  glyphTone = "text-accent",
}: {
  code: number | null;
  /** His card; a man with none reads as a plain line. */
  card: SquadPlayerDetail | undefined;
  name: string;
  /** The form a phone initials (`PlayerName`); `name` stands on a desk. */
  short?: string;
  holders: Holders;
  figure: string;
  note?: string | null;
  /** A goal takes the ball, a sending off the card, an injury the cross; a missed penalty none, its word says it. */
  glyph?: EventGlyph | null;
  /** Its ink. A card is red because it IS a red card; the ball is the accent. */
  glyphTone?: string;
}) {
  return (
    <MaybeCard
      player={card}
      // A phone tops the glyph on the name's first line (a baseline row set the ball four pixels low); a desk centres it.
      className="group flex min-h-9 w-full gap-1.5 text-left max-lg:items-start max-lg:py-1 lg:min-h-11 lg:items-center lg:gap-3"
    >
      {glyph === null ? null : (
        // `EventIcon` is 1.1em, so it states its own size: level with the name on a phone, a step up on the desk.
        <span className={`flex shrink-0 items-center text-lg max-lg:h-[1lh] lg:text-4xl ${glyphTone}`}>
          <EventIcon glyph={glyph} />
        </span>
      )}
      <span className={`${NAME_BLOCK} max-lg:text-lg`}>
        <span className={SCORER_FIGURE}>{figure}</span>
        <span className={`${KEEPS_WIDTH} group-hover:underline ${NAME}`}>
          <PlayerName name={name} short={short} />
        </span>
        {note === null ? null : <> <span className={`${SMALL_CAPS} shrink-0 text-bad lg:ml-1.5`}>{note}</span></>}{" "}
        <LeagueHolder code={code} holders={holders} className={`lg:ml-1.5 ${GIVES_WAY}`} />
      </span>
    </MaybeCard>
  );
}

/** A run of minutes as a scoresheet prints them. */
function minutes(said: readonly number[]): string {
  return said.map((minute) => `${minute}'`).join(", ");
}
