import Image from "next/image";
import {
  crestUrl,
  type PublishedStory,
  type StoryLineupMan,
  type StoryLineupNews,
  type StoryLineupSide,
  initialled,
  londonDayAndTime,
  DASH,
} from "@epl/core";
import { LINEUP_NEWS_MEN, START_DOUBT_MINUTES } from "../../config";
import { yoursInk } from "../../mine";
import { HAIRLINES, RULE } from "./rules";
import { CAPTION, CAPTION_CAPS } from "./heads";

/** The xMins column: its own width and a faint rule down its left, header and rows alike, so it reads as one column. */
const MINUTES_COLUMN = `w-9 shrink-0 border-l ${RULE} pl-1.5 text-right sm:w-11`;

/** OUT is the loud one, as on the Team Sheet: ranked in scale, never in hue (DESIGN §4). */
const STATUS: Record<NonNullable<StoryLineupMan["status"]>, string> = {
  OUT: "font-semibold text-ink",
  Doubt: "text-muted",
};

// The gameweek's predicted elevens by match: a listing printed from the export, which no writer sees.

export default function Lineups({
  story,
  mine,
}: {
  story: PublishedStory;
  mine: string | null;
}) {
  const ties = story.extras?.lineups ?? [];
  if (ties.length === 0) return null;
  // A filing from before xMins were filed carries none, and would print a dash beside every man.
  const minuted = ties.some((tie) => [tie.home, tie.away].some((side) => side.men.some((man) => man.xMins !== undefined)));

  return (
    <div className={`flex flex-col pt-4 ${HAIRLINES}`}>
      {ties.map((tie) => (
        <section key={`${tie.home.code}-${tie.away.code}`} className="py-4">
          <p className={CAPTION}>
            {londonDayAndTime(tie.kickoff)}
          </p>
          {/* Side by side at every width: a match is two teams facing each
              other, and stacked they read as a list of twenty clubs. */}
          <div className="grid grid-cols-2 gap-x-3 pt-2 sm:gap-x-6">
            <Side side={tie.home} mine={mine} minuted={minuted} />
            <Side side={tie.away} mine={mine} minuted={minuted} />
          </div>
        </section>
      ))}
    </div>
  );
}

function Side({
  side,
  mine,
  minuted,
}: {
  side: StoryLineupSide;
  mine: string | null;
  minuted: boolean;
}) {
  return (
    <div>
      <h2 className="flex items-center gap-2">
        {/* Not `.crest` (a raster reads no desk token); boxed square, since a tall badge pushed its eleven down a line. */}
        <Image
          src={crestUrl({ code: side.code })}
          alt=""
          width={24}
          height={24}
          className="h-5 w-5 shrink-0 object-contain sm:h-6 sm:w-6"
        />
        <span className="paper-display min-w-0 truncate text-base leading-none font-semibold text-ink sm:text-lg">
          {side.club}
        </span>
        <span className="numeric shrink-0 text-3xs text-muted sm:text-2xs">{side.formation}</span>
      </h2>
      {/* The column's head, so a bracketed figure is never read as anything but expected minutes. */}
      {!minuted ? null : (
        <div className="flex justify-end pt-1.5">
          <span className={`${MINUTES_COLUMN} font-sans text-3xs font-semibold tracking-wide text-muted sm:text-2xs`}>xMins</span>
        </div>
      )}
      <ol className={`flex flex-col ${minuted ? "" : "pt-1.5"}`}>
        {side.men.map((man) => (
          <li key={man.name} className="flex gap-1.5 text-sm leading-snug sm:gap-2 sm:text-base">
            {/* His REAL position, in a gutter of its own so eleven names line
                up — the whole of what makes a team sheet scannable. A dash
                where the export had only FPL's fantasy letter to go on. */}
            <span className="w-6 shrink-0 pt-0.5 font-sans text-3xs font-bold tracking-wide text-muted uppercase sm:w-9 sm:pt-1 sm:text-2xs sm:tracking-widest">
              {man.position ?? DASH}
            </span>
            <p className="min-w-0 flex-1">
              {/* Initial and surname, and no holder's name: two columns on a phone have no room; the reader's own take his ink. */}
              <span className={yoursInk(man.owner !== undefined && man.owner === mine)}>
                {initialled(man.name)}
              </span>
              {/* Printed as predicted, never replaced: the mark says the football has him out or in doubt. */}
              {man.status === undefined ? null : (
                <span className={`${CAPTION_CAPS} pl-1.5 ${STATUS[man.status]}`}>{man.status}</span>
              )}
            </p>
            {/* His xMins, loud in scale under the planner's floor, as the paper ranks; a dash where the model has none. */}
            {!minuted ? null : (
              <span
                title="Expected minutes"
                className={`numeric ${MINUTES_COLUMN} pt-0.5 text-xs sm:text-sm ${man.xMins !== undefined && man.xMins < START_DOUBT_MINUTES ? "font-bold text-ink" : "text-muted"}`}
              >
                {man.xMins === undefined ? DASH : `(${man.xMins})`}
              </span>
            )}
          </li>
        ))}
      </ol>
      <TeamNews news={side.news ?? []} mine={mine} />
    </div>
  );
}

/** Who misses out, under the eleven: the filing's first few (it leads with the men who play most), a line for the OUT
 *  and one for the doubts, each man's complaint in a few words, and a count of the rest. */
function TeamNews({
  news,
  mine,
}: {
  news: readonly StoryLineupNews[];
  mine: string | null;
}) {
  if (news.length === 0) return null;
  const shown = news.slice(0, LINEUP_NEWS_MEN);
  const rest = news.length - shown.length;
  const rows = (Object.keys(STATUS) as StoryLineupNews["status"][])
    .map((status) => ({ status, men: shown.filter((man) => man.status === status) }))
    .filter((row) => row.men.length > 0);
  return (
    <div className="flex flex-col gap-1 pt-2 text-xs leading-snug sm:text-sm">
      {rows.map(({ status, men }) => (
        <p key={status} className="text-muted">
          <span className={`${CAPTION_CAPS} pr-1.5 ${STATUS[status]}`}>{status}</span>
          {men.map((man, at) => (
            <span key={man.name}>
              {at === 0 ? null : "; "}
              <span className={yoursInk(man.owner !== undefined && man.owner === mine)}>{initialled(man.name)}</span>
              {man.note === undefined ? null : <> – {man.note}</>}
            </span>
          ))}
        </p>
      ))}
      {rest === 0 ? null : <p className="text-faint">+{rest} more</p>}
    </div>
  );
}
