import Image from "next/image";
import { Fragment } from "react";
import Link from "@/app/components/shell/Link";
import ScrollBoard from "./ScrollBoard";
import type { Deal, DealSide } from "@epl/core";
import { crestForShortName, fantraxInstant, inkOn, kindOf, londonDayAndDate, londonDayMonth, londonDayOf, londonWeekday, moverOf, movement, toFplClubCode, initialled, DASH } from "@epl/core";
import { INDEX_SPINE, LABEL, PANEL_FLUSH, SMALL_CAPS } from "@/app/desk";
import TeamName from "./TeamName";
import PlayerName from "../shell/PlayerName";
import { positionsFromList, positionsLabel } from "../../positions";
import { teamColours } from "@/app/teamColours";
import { playerHref } from "@/app/players/routes";

// One manager's business as CM's Transfers screen (`cm0102/23.jpg`): a blue date block, the type in
// yellow, who came in white, who went out faint, and a trade's partner on his own colour. With no team, the
// league's: each row from the side of the team whose move it was, named on its own colour. Grouped, a phone heads each
// day once instead of a date block on every row.

/** A name a step above `ROW_NAME`: a date, a type and two names are this screen's whole content (DESIGN §6). */
const NAME = "font-chrome text-base font-bold lg:text-lg";

/** The phone's grid: a dated row leads with its date block's column, then the type's, sized to the mover's plate or
 *  a team's own type. Written out, as Tailwind reads a class only whole. */
const COLUMNS = {
  grouped: { everyone: "grid-cols-[5.25rem_minmax(0,1fr)]", team: "grid-cols-[4rem_minmax(0,1fr)]" },
  dated: { everyone: "grid-cols-[auto_5.25rem_minmax(0,1fr)]", team: "grid-cols-[auto_4rem_minmax(0,1fr)]" },
} as const;

/** A row's breathing room under a thumb, on its cells, so the date block beside them runs rule to rule. */
const ROW_TOP = "max-lg:pt-0.5";
const ROW_FOOT = "max-lg:pb-0.5";

/** A club crest, or the empty slot that keeps the names in line when there is none. */
const CREST = "size-5 shrink-0 object-contain lg:size-6";

export default function Ledger({
  deals,
  teamId,
  nameOf,
  groupByDay = false,
}: {
  deals: readonly Deal[];
  /** Whose business; none is the whole league's, every row naming its mover. */
  teamId?: string;
  /** A team's name by id, `—` for one the league no longer lists; the row's own copy goes stale on a rename. */
  nameOf: (teamId: string) => string;
  /** Below `lg`, one day heading over each London day's deals in place of every row's date block. */
  groupByDay?: boolean;
}) {
  const everyone = teamId === undefined;
  const instants = deals.map((deal) => fantraxInstant(deal.processedAt ?? ""));
  const rows = deals.map((deal, at) => {
    const mover = teamId ?? moverOf(deal);
    // The feed is newest first, so a day's deals run together and a heading opens each run.
    const opens = groupByDay && (at === 0 || londonDayOf(instants[at - 1]) !== londonDayOf(instants[at]));
    return { deal, mover, instant: instants[at], opens, ...movement(deal, mover ?? "") };
  });
  // A claim is with nobody, so the With column is drawn only when a trade is listed.
  const traded = rows.some((row) => row.partners.length > 0);
  return (
    <section className={PANEL_FLUSH}>
      <div className={`cm-bevel hidden h-6 items-center gap-2 pr-1.5 ${SMALL_CAPS} lg:flex`}>
        <span className="w-24 shrink-0 px-1.5">Date</span>
        {everyone ? <span className="w-32 shrink-0">Team</span> : null}
        <span className="w-24 shrink-0">Type</span>
        <span className="min-w-0 flex-1">In</span>
        <span className="min-w-0 flex-1">Out</span>
        {traded ? <span className="w-32 shrink-0">With</span> : null}
      </div>

      <ScrollBoard>
        <ul className="cm-rows flex flex-col">
          {rows.map(({ deal, mover, instant, opens, in: arrived, out: left, partners }) => {
            const kind = (
              <span
                className={`${SMALL_CAPS} text-info lg:order-2 lg:w-24 lg:shrink-0 lg:text-left lg:text-sm ${everyone ? "ml-auto min-w-0 text-right lg:ml-0" : "min-w-0"}`}
              >
                {kindOf(deal, arrived.length, left.length)}
              </span>
            );
            const key = deal.setId || `${deal.processedAt}-${deal.period}`;
            return (
              <Fragment key={key}>
                {opens ? (
                  <li className="px-1.5 pb-0.5 pt-2 text-xs font-bold text-mid lg:hidden">{instant === null ? DASH : londonDayAndDate(instant)}</li>
                ) : null}
                {/* Two rows under a thumb, In beside the type and Out beside whose move; one row on a desk. A dated row's
                    date block spans both down the left, and the cells take the columns after it. */}
                <li
                  className={`cm-row grid ${COLUMNS[groupByDay ? "grouped" : "dated"][everyone ? "everyone" : "team"]} items-center gap-x-2 pr-1.5 lg:flex lg:min-h-14 lg:gap-2 lg:py-1.5 lg:pl-0 ${groupByDay ? "pl-1.5" : ""}`}
                >
                  <Day at={instant} weekday={!everyone} deskOnly={groupByDay} />
                  <span className={`row-start-1 flex items-center gap-1 ${ROW_TOP} lg:contents`}>{kind}</span>
                  <span className={`row-start-2 flex flex-col gap-0.5 ${ROW_FOOT} lg:contents`}>
                    {everyone ? (
                      <span className="shrink-0 lg:order-1 lg:w-32">
                        {mover === null ? DASH : <TeamPlate teamId={mover} name={nameOf(mover)} />}
                      </span>
                    ) : null}
                    {/* Who he traded with: under whose move on a phone, the last column on a desk. */}
                    {traded ? (
                      <span className={`shrink-0 lg:order-last lg:w-32 ${partners.length === 0 ? "hidden lg:block" : ""}`}>
                        {partners.length === 0 ? null : (
                          <span className="flex flex-col items-stretch gap-0.5">
                            {/* The desk's With head, said on the phone: two plates flush read as one side (UX-8). */}
                            <span className={`text-center ${LABEL} lg:hidden`}>With</span>
                            <TeamPlate teamId={partners[0]} name={nameOf(partners[0])} />
                            {partners.length > 1 ? (
                              <span className="text-center text-2xs text-faint">+{partners.length - 1}</span>
                            ) : null}
                          </span>
                        )}
                      </span>
                    ) : null}
                  </span>

                  {/* Both sides always drawn, so a claim's empty side is a dash rather than a reflow. */}
                  <Side players={arrived} tone="text-ink" label="In" className={`row-start-1 ${ROW_TOP} lg:order-3`} />
                  <Side players={left} tone="text-faint" label="Out" className={`row-start-2 ${ROW_FOOT} lg:order-4`} />
                </li>
              </Fragment>
            );
          })}
        </ul>
      </ScrollBoard>
    </section>
  );
}

/** One side of a deal: each man's club crest, name and positions (a defender for a forward is a different deal). */
function Side({
  players,
  tone,
  label,
  className,
}: {
  players: DealSide[];
  tone: string;
  /** "In" or "Out", printed only on a phone, where the head strip is hidden. */
  label: string;
  /** Its cell in the phone's two rows, and its place in the desk's strip. */
  className: string;
}) {
  return (
    <span className={`flex min-w-0 flex-1 items-center gap-1.5 ${tone} ${className}`}>
      <span className={`w-7 shrink-0 ${LABEL} lg:hidden`}>{label}</span>
      <span className="flex min-w-0 flex-1 flex-col justify-center gap-0.5">
        {players.length === 0 ? (
          <span className={`flex items-center gap-1.5 ${NAME}`}>
            <span className={CREST} />
            {DASH}
          </span>
        ) : (
          players.map((player) => {
            // His real club as its crest; an unknown club leaves the slot empty rather than guess.
            const crest = player.club ? crestForShortName(toFplClubCode(player.club)) : null;
            // A 28 floor on every name, linked or not, so stacked names keep one rhythm and In sits close on Out.
            const line = `flex min-w-0 items-center gap-1.5 min-h-7 ${NAME}`;
            const body = (
              <>
                {crest ? (
                  <Image src={crest} alt={player.clubName ?? toFplClubCode(player.club ?? "")} width={24} height={24} className={CREST} />
                ) : (
                  <span className={CREST} />
                )}
                <Named name={player.playerName} position={player.position} />
              </>
            );
            // His page; a deal from another feed carries no id and stays text.
            return player.fantraxId === undefined ? (
              <span key={player.playerName} className={line}>{body}</span>
            ) : (
              <Link
                key={player.playerName}
                href={playerHref(player.fantraxId)}
                className={`${line} hover:underline`}
              >
                {body}
              </Link>
            );
          })
        )}
      </span>
    </span>
  );
}

/** A man by the one list rule (`PlayerName`: I. Surname under a thumb, in full on a desk) and his positions as the board
 *  leads' caps label. Under a thumb the label is tied to the name's last letter, so it never starts a line alone. */
function Named({ name, position }: { name: string; position?: string | null }) {
  const label = positionsLabel(positionsFromList(position));
  if (label === null) {
    return (
      <span className="min-w-0 [overflow-wrap:anywhere] lg:truncate">
        <PlayerName name={name} />
      </span>
    );
  }
  const tag = <span className={`${LABEL} shrink-0`}>{label}</span>;
  const short = initialled(name);
  const last = [...new Intl.Segmenter("en", { granularity: "grapheme" }).segment(short)].pop()?.segment ?? "";
  return (
    <>
      <span className="min-w-0 [overflow-wrap:anywhere] lg:hidden">
        {short.slice(0, short.length - last.length)}
        <span className="whitespace-nowrap">
          {last}{"\u00a0"}{tag}
        </span>
      </span>
      <span className="hidden min-w-0 items-baseline gap-1.5 lg:flex">
        <span className="truncate">{name}</span>
        {tag}
      </span>
    </>
  );
}

/** The London day, as Mail spells it and never cut; the league's list drops the weekday under a thumb, for the type's room.
 *  `deskOnly` when a day heading says it under a thumb. */
function Day({ at, weekday, deskOnly }: { at: string | null; weekday: boolean; deskOnly: boolean }) {
  return (
    <span className={`${INDEX_SPINE} numeric col-start-1 row-span-2 row-start-1 shrink-0 items-center whitespace-nowrap px-1.5 py-0.5 lg:w-24 ${deskOnly ? "hidden lg:flex" : weekday ? "flex w-24" : "flex"}`}>
      {at === null ? (
        DASH
      ) : (
        <>
          <span className={weekday ? "" : "hidden lg:inline"}>{londonWeekday(at)} </span>
          {londonDayMonth(at)}
        </>
      )}
    </span>
  );
}

/** A team as a plate in its own colour, keyed on the id the deal carries: a trade's other side, or the league's mover. */
function TeamPlate({ teamId, name }: { teamId: string; name: string }) {
  const colours = teamColours(teamId);
  return (
    <span
      className={`block truncate px-1.5 py-0.5 text-center lg:line-clamp-2 lg:whitespace-normal ${SMALL_CAPS}`}
      style={{ background: colours.primary, color: inkOn(colours) }}
    >
      {/* A manager who has left the league still has an id on the row. The league's short name under a thumb, where
          the full one ran out of plate ("DOMEITALYC…"); the desk's full name wraps to two lines in the plate. */}
      {name === DASH ? "Unknown" : <TeamName teamId={teamId} name={name} />}
    </span>
  );
}
