import Image from "next/image";
import { type Club, type Fixture, type FootballPlayer, type PlayerOwner, type PrinterKind, type PrinterLine, crestUrl } from "@epl/core";
import Section from "../components/shell/Section";
import StepHead from "../components/shell/StepHead";
import { LIVE } from "../components/shell/sections";
import EventIcon, { type EventGlyph } from "../components/football/EventIcon";
import type { DayStep } from "./scoreDay";
import { type PrinterMan, type PrinterRow, printerRow } from "./printerRow";

// The vidiprinter (Craig, 30 Oct 2026): Sky's teleprinter, one row per event with both men, newest first across matches.

/** The Live tab's vidiprinter view, by its query value. */
export const VIDIPRINTER_VIEW = "vidiprinter";
export const VIDIPRINTER_HREF = `${LIVE}?view=${VIDIPRINTER_VIEW}`;

/** Each kind's glyph off the match report's set; a man's full-time counts take none. */
const GLYPH: Record<PrinterKind, EventGlyph | null> = {
  "kick-off": "whistle",
  "half-time": "whistle",
  "full-time": "whistle",
  goal: "ball",
  "penalty-goal": "ball",
  "own-goal": "ball",
  booked: "card",
  "sent-off": "card",
  sub: "swap",
  injury: "cross",
  tally: null,
};

/** A count row's glyph, in the event column: the match report's shield for DefCon, its hand for a keeper (Craig, 30 Oct 2026). */
const COUNT_GLYPH: Record<NonNullable<PrinterRow["counts"][number]["sort"]>, EventGlyph> = { defcon: "block", keeper: "save" };

/** The event's ink, as the match report's: a goal a gain, a card its colour, a loss red, a change the pitch's sub amber. */
const TONE: Record<PrinterKind, string> = {
  "kick-off": "text-mid",
  "half-time": "text-mid",
  "full-time": "text-mid",
  goal: "text-up",
  "penalty-goal": "text-up",
  "own-goal": "text-bad",
  booked: "text-accent",
  "sent-off": "text-bad",
  sub: "text-mid",
  injury: "text-bad",
  tally: "text-muted",
};

/** One face for the whole line; names one step up, the rest of it one step down. */
const LINE = "cm-row flex items-start gap-1.5 px-1.5 py-1.5 font-chrome lg:gap-2 lg:px-2 lg:py-1";
const NAME = "text-sm font-bold lg:text-base";
const TEXT = "text-xs lg:text-sm";
const WORD = `${TEXT} font-bold uppercase`;
/** The minute's own column (Craig, 30 Oct 2026): as wide as `90+5′`, right-aligned so it and `7′` end together. */
const MINUTE_SLOT = `w-7 shrink-0 text-right numeric min-h-5 leading-5 lg:w-10 ${TEXT} text-ink`;
/** The event's own column: its coloured icon on a phone, so both men fit one row at 390; the word joins it on a desk. */
const WORD_SLOT = `flex w-5 shrink-0 items-center gap-1 lg:w-24 min-h-5 ${WORD}`;

export default function Vidiprinter({
  lines,
  day,
  fixtures,
  clubs,
  players,
  owners,
  mine,
}: {
  lines: readonly PrinterLine[];
  day: DayStep | null;
  fixtures: readonly Fixture[];
  clubs: Map<number, Club>;
  players: readonly FootballPlayer[];
  owners: ReadonlyMap<number, PlayerOwner>;
  mine: string | null;
}) {
  const byCode = new Map(fixtures.map((f) => [f.code, f]));
  const byMan = new Map(players.map((p) => [p.code, p]));

  return (
    // No head: the tab above already names the view. A desk keeps the column to a reading width.
    <div className="lg:max-w-3xl">
      <Section>
        {day === null ? null : <StepHead label="Match days" title={day.title} previous={day.previous} next={day.next} heading="h3" />}
        {lines.length === 0 ? (
          <p className="px-2 py-3 text-sm text-muted">Nothing on the vidiprinter yet.</p>
        ) : (
          <ul className="cm-rows">
            {lines.filter((line) => line.kind !== "half-time").map((line) => (
              <Row key={line.key} row={printerRow(line, byCode, clubs, byMan, owners)} mine={mine} />
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}

function Row({ row, mine }: { row: PrinterRow; mine: string | null }) {
  const counted = row.counts.find((count) => count.sort !== null)?.sort;
  const glyph = row.kind === "tally" && counted !== undefined && counted !== null ? COUNT_GLYPH[counted] : GLYPH[row.kind];
  return (
    <li className={LINE}>
      <span className={MINUTE_SLOT}>{row.minute}</span>
      <span className={`${WORD_SLOT} ${TONE[row.kind]}`}>
        {glyph === null ? null : <EventIcon glyph={glyph} />}
        {row.word === null ? null : <span className="sr-only lg:not-sr-only">{row.word}</span>}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        {/* Scorer and assister, or both men of a change, on one row (Craig, 30 Oct 2026): a long holder truncates. */}
        <span className="flex min-w-0 items-center gap-x-1.5">
          {row.sides === null ? null : (
            <>
              {/* `AVL 2–1 MCI`, read as `ARS v EVE` is at kick-off (Craig, 30 Oct 2026). */}
              <Side side={row.sides[0]} />
              {row.sides[0].score === null || row.sides[1].score === null ? (
                <span className={`${TEXT} text-muted`}>v</span>
              ) : (
                <span className={`${NAME} numeric whitespace-nowrap text-ink`}>
                  {row.sides[0].score}–{row.sides[1].score}
                </span>
              )}
              <Side side={row.sides[1]} />
            </>
          )}
          {row.man === null ? null : <Man man={row.man} mine={mine} />}
          {row.second === null ? null : (
            <>
              <span className={`${WORD} shrink-0 text-muted`}>{row.second.word}</span>
              <Man man={row.second.man} mine={mine} crest={false} />
            </>
          )}
        </span>
        {row.counts.length === 0 ? null : (
          // Every count a flex item on one centre line, the dot between them level with the words.
          <span className={`flex flex-wrap items-center gap-x-1.5 ${TEXT} text-muted`}>
            {/* On a change the counts are the man taken off's, so they name him rather than read as the arrival's. */}
            {row.second === null || row.kind === "tally" ? null : <span className="text-ink">{row.second.man.name}</span>}
            {row.counts.map((count, at) => (
              <span key={count.name} className="inline-flex items-center gap-1 whitespace-nowrap">
                {at === 0 ? null : <span aria-hidden>·</span>}
                {count.name}
                {count.value === null ? null : <span className="numeric text-ink">{count.value}</span>}
                <span className="numeric font-bold text-info">{count.points}</span>
              </span>
            ))}
          </span>
        )}
      </span>
    </li>
  );
}

function Crest({ club }: { club: Club | null }) {
  return club === null ? null : <Image src={crestUrl(club)} alt="" width={20} height={20} className="h-4 w-4 shrink-0 object-contain lg:h-5 lg:w-5" />;
}

/** One man: his club's crest, his name and who holds him, bracketed as Sky prints it, then his points. */
function Man({ man, mine, crest = true }: { man: PrinterMan; mine: string | null; crest?: boolean }) {
  // The name never gives way; the holder truncates first. The second man shares the first's club, so no second crest.
  return (
    <span className="flex min-w-0 items-center gap-1">
      {crest ? <Crest club={man.club} /> : null}
      <span className={`${NAME} shrink-0 whitespace-nowrap ${man.owner !== null && man.owner.teamId === mine ? "text-accent" : "text-ink"}`}>{man.name}</span>
      {man.owner === null ? null : (
        <span className={`${TEXT} min-w-0 truncate ${man.owner.teamId === mine ? "text-accent" : "text-ink"}`}>({man.owner.teamName})</span>
      )}
      {man.points === null ? null : <span className={`${TEXT} numeric shrink-0 font-bold text-info`}>{man.points}</span>}
    </span>
  );
}

/** One side of a match on a whistle: its crest and its three letters; the score sits between the two. */
function Side({ side }: { side: NonNullable<PrinterRow["sides"]>[0] }) {
  return (
    <span className="flex min-w-0 items-center gap-1 whitespace-nowrap">
      <Crest club={side.club} />
      <span className={`${NAME} text-ink`}>{side.name}</span>
    </span>
  );
}
