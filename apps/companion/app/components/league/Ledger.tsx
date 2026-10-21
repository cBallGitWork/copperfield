import Image from "next/image";
import { Fragment } from "react";
import Link from "@/app/components/shell/Link";
import ScrollBoard from "./ScrollBoard";
import type { Deal, DealSide } from "@epl/core";
import { crestForShortName, fantraxInstant, inkOn, kindOf, londonDayAndDate, londonDayMonth, londonDayOf, londonWeekday, moverOf, movement, toFplClubCode, DASH } from "@epl/core";
import { LABEL, PANEL_FLUSH, SMALL_CAPS } from "@/app/desk";
import TeamName from "./TeamName";
import { teamColours } from "@/app/teamColours";
import { playerHref } from "@/app/players/routes";

// One manager's business as CM's Transfers screen (`cm0102/23.jpg`): a blue date block, the type in
// yellow, who came in white, who went out faint, and a trade's partner on his own colour. With no team, the
// league's: each row from the side of the team whose move it was, named on its own colour. Grouped, a phone heads each
// day once instead of a date block on every row.

/** A name a step above `ROW_NAME`: a date, a type and two names are this screen's whole content (DESIGN §6). */
const NAME = "font-chrome text-base font-bold lg:text-lg";

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
      <div className={`cm-bevel hidden h-6 items-center gap-2 px-1.5 ${SMALL_CAPS} lg:flex`}>
        <span className="w-24 shrink-0">Date</span>
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
                className={`${SMALL_CAPS} text-info lg:order-2 lg:w-24 lg:shrink-0 lg:text-left lg:text-sm ${everyone ? "ml-auto min-w-0 text-right lg:ml-0" : groupByDay ? "min-w-0" : "w-24"}`}
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
                {/* Two rows under a thumb, In beside the date or type and Out beside whose move; one row on a desk. */}
                <li
                  className={`cm-row grid ${groupByDay ? (everyone ? "grid-cols-[5.25rem_minmax(0,1fr)]" : "grid-cols-[4rem_minmax(0,1fr)]") : "grid-cols-[6rem_minmax(0,1fr)]"} items-center gap-x-2 px-1.5 py-1 lg:flex lg:min-h-14 lg:gap-2 lg:py-1.5`}
                >
                  <span className="col-start-1 row-start-1 flex items-center justify-between gap-1 lg:contents">
                    <Day at={instant} weekday={!everyone} deskOnly={groupByDay} />
                    {/* The league's list, or a grouped one, sets the type beside In, leaving the row below to whose move. */}
                    {everyone || groupByDay ? kind : null}
                  </span>
                  <span className="col-start-1 row-start-2 flex flex-col gap-0.5 lg:contents">
                    {everyone ? (
                      <span className="shrink-0 lg:order-1 lg:w-32">
                        {mover === null ? DASH : <TeamPlate teamId={mover} name={nameOf(mover)} />}
                      </span>
                    ) : groupByDay ? null : (
                      kind
                    )}
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
                  <Side players={arrived} tone="text-ink" label="In" className="col-start-2 row-start-1 lg:order-3" />
                  <Side players={left} tone="text-faint" label="Out" className="col-start-2 row-start-2 lg:order-4" />
                </li>
              </Fragment>
            );
          })}
        </ul>
      </ScrollBoard>
    </section>
  );
}

/** One side of a deal: each man's club crest, name and position (a defender for a forward is a different deal). */
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
            // The desk row's 28 floor on every name, linked or not, so stacked names keep one rhythm.
            const line = `flex min-w-0 items-center gap-1.5 lg:min-h-7 ${NAME}`;
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
            // His page, at a tap row's 36 under a thumb; a deal from another feed carries no id and stays text.
            return player.fantraxId === undefined ? (
              <span key={player.playerName} className={line}>{body}</span>
            ) : (
              <Link
                key={player.playerName}
                href={playerHref(player.fantraxId)}
                className={`${line} max-lg:min-h-9 hover:underline`}
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

/** Under a thumb one run of text whose last letter carries the position, so the tag never starts a line alone; a desk
 *  cuts the name, never the tag. Both render and CSS picks, as `TeamName` does. */
function Named({ name, position }: { name: string; position?: string | null }) {
  if (!position) return <span className="min-w-0 [overflow-wrap:anywhere] lg:truncate">{name}</span>;
  const tag = "text-2xs font-bold text-mid lg:text-xs";
  const last = [...new Intl.Segmenter("en", { granularity: "grapheme" }).segment(name)].pop()?.segment ?? "";
  return (
    <>
      <span className="min-w-0 [overflow-wrap:anywhere] lg:hidden">
        {name.slice(0, name.length - last.length)}
        <span className="whitespace-nowrap">
          {last}{"\u00a0"}<span className={tag}>({position})</span>
        </span>
      </span>
      <span className="hidden min-w-0 items-center gap-1.5 lg:flex">
        <span className="truncate">{name}</span>
        <span className={`shrink-0 ${tag}`}>({position})</span>
      </span>
    </>
  );
}

/** The London day, as Mail spells it and never cut; the league's list drops the weekday under a thumb, for the type's room.
 *  `deskOnly` when a day heading says it under a thumb. */
function Day({ at, weekday, deskOnly }: { at: string | null; weekday: boolean; deskOnly: boolean }) {
  return (
    <span className={`cm-index numeric shrink-0 whitespace-nowrap px-1.5 py-0.5 lg:w-24 ${deskOnly ? "hidden lg:block" : weekday ? "w-24" : ""}`}>
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
