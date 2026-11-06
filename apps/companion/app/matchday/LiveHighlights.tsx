import Image from "next/image";
import { type FootballSnapshot, YOUTUBE_THUMB_BASE, clubById, fixturesInOrder, londonDay } from "@epl/core";
import Section from "../components/shell/Section";
import StepHead from "../components/shell/StepHead";
import Link from "@/app/components/shell/Link";
import { LIVE } from "../components/shell/sections";
import { QUIET_NOTE } from "@/app/desk";
import { highlightVideos } from "../matchFeed";
import { matchHref } from "../prem/match/[id]/matchRoutes";
import { now } from "../clock";
import { dayStep, matchDays } from "./scoreDay";
import { highlightRows } from "./highlightRows";

/** The highlights view's query value and its link, beside Scores, Vidiprinter and the top stats. */
export const HIGHLIGHTS_VIEW = "highlights";
export const HIGHLIGHTS_HREF = `${LIVE}?view=${HIGHLIGHTS_VIEW}`;

/** Live's highlights (Craig, 6 Nov 2026: "Highlights tab works"): each finished match of the day with Sky's still,
 *  a tap to its match page's Highlights tab, which plays it; the finished ones Sky has not posted are named under. */
export default async function LiveHighlights({ snapshot, day: asked }: { snapshot: FootballSnapshot; day: string | undefined }) {
  const round = fixturesInOrder(snapshot);
  const day = dayStep(matchDays(round), londonDay(now()), asked, HIGHLIGHTS_HREF);
  const { rows, waiting } = highlightRows(round, clubById(snapshot), await highlightVideos(), day?.day ?? null);

  return (
    // No head: the tab above names the view. A desk keeps the column to a reading width.
    <div className="lg:max-w-3xl">
      <Section>
        {day === null ? null : <StepHead label="Match days" title={day.title} previous={day.previous} next={day.next} heading="h3" />}
        {rows.length === 0 ? (
          <p className="px-2 py-3 text-sm text-muted">No highlights yet.</p>
        ) : (
          <ul className="cm-rows">
            {rows.map(({ fixture, home, away, video }) => (
              <li key={fixture.id}>
                <Link href={matchHref(fixture.id, "highlights")} className="flex min-h-11 items-center gap-3 py-2">
                  {/* Sky's 16:9 still, not the 4:3 one the paper crops, with the play mark the match report draws. */}
                  <span className="relative aspect-video w-32 shrink-0 overflow-hidden border border-line sm:w-40">
                    <Image src={`${YOUTUBE_THUMB_BASE}/${video.id}/mqdefault.jpg`} alt="" fill sizes="10rem" className="object-cover" />
                    <span className="absolute inset-0 flex items-center justify-center" aria-hidden>
                      <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-ink bg-bg/70 text-ink">
                        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current"><path d="M8 5v14l11-7z" /></svg>
                      </span>
                    </span>
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="flex items-baseline justify-between gap-2 text-sm">
                      <span className="min-w-0 truncate">{home.shortName}</span>
                      <span className="numeric shrink-0 font-bold">{`${fixture.homeScore}–${fixture.awayScore}`}</span>
                      <span className="min-w-0 truncate text-right">{away.shortName}</span>
                    </span>
                    {/* Their title, verbatim: their cut and their words, pointed at, not republished. */}
                    <span className="line-clamp-2 text-xs text-muted">{video.title}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Section>
      {waiting.length === 0 ? null : (
        <p className={`${QUIET_NOTE} px-2 pt-2`}>
          {`Not posted yet: ${waiting.map(({ home, away }) => `${home.shortName} v ${away.shortName}`).join(", ")}. Sky's highlights usually land within two hours of full time.`}
        </p>
      )}
      <p className={`${QUIET_NOTE} px-2 pt-1`}>Sky Sports Premier League</p>
    </div>
  );
}
