import { clubById, londonDayAndTime, openingGameweek } from "@epl/core";
import { named } from "../components/gazette/named";
import Teaser from "../components/gazette/Teaser";
import Brief from "../components/gazette/Brief";
import Drawing from "../components/gazette/Drawing";
import Splash from "../components/gazette/Splash";
import Deals from "../components/gazette/Deals";
import Lead from "../components/gazette/Stories";
import Picture from "../components/gazette/Picture";
import StoryFace, { hasPicture } from "../components/gazette/StoryFace";
import Masthead from "../components/gazette/Masthead";
import ReadViews from "../components/shell/ReadViews";
import TeamOfTheWeek from "../components/gazette/TeamOfTheWeek";
import { HEADLINES_SHOWN, PAPER_NAME, SHOULDER_STORIES } from "../config";
import Column from "../components/gazette/Column";
import Silence from "../components/gazette/Silence";
import PaperTable from "../components/gazette/PaperTable";
import { edition } from "../edition";
import { readerTeamId } from "../squads";
import { readCalendar } from "../round";
import { draftRows, footballRows, scorerRows } from "../tables";
import { titled } from "../titles";
import { shortName } from "../teamNames";

// The Gazetta's front page: the stories, the eleven, the tables, the business and the lock.
// A section with nothing to say does not appear; the register is `(paper)/layout.tsx`'s.

export const metadata = titled(PAPER_NAME);

export default async function GazettePage() {
  // Every read at once: none needs another's answer, and a Fantrax that hangs would cost each its wait in turn.
  // The tables come from reads the page already makes, and the calendar names the lock's gameweek.
  const [mine, paper, draftTable, football, scorers, calendar] = await Promise.all([
    readerTeamId(),
    edition(),
    draftRows(),
    footballRows(),
    scorerRows(),
    readCalendar(),
  ]);
  const draft = draftTable.map((row) => ({ ...row, yours: row.key === mine }));
  // One club lookup for the whole page.
  const clubs = paper.snapshot ? clubById(paper.snapshot) : new Map();
  // Fantrax's lock is by period: the reader gets the gameweek it opens, or no number where the calendar cannot say.
  const lockGameweek = paper.deadline ? openingGameweek(calendar, paper.deadline.period) : undefined;
  // A deal with no other side came off the wire.
  const byId = named(paper.teams);
  const who = (teamId: string | null) => (teamId === null ? "the wire" : byId(teamId));
  // A sidebar list names a team short, as the tables beside it do; a story's prose keeps the full name.
  const dealWho = (teamId: string | null) => (teamId === null ? "the wire" : shortName(teamId, byId(teamId)));

  // The ranks under the splash, sliced together so the two boundaries cannot drift.
  const shoulders = paper.filed.slice(1, SHOULDER_STORIES + 1);
  // Twin shoulders carry pictures together or not at all: headlines at two heights read as a fault.
  const shouldersPictured = shoulders.every(hasPicture);
  const briefs = paper.filed.slice(SHOULDER_STORIES + 1, HEADLINES_SHOWN + 1);
  // The lead: the splash's picture (the drawing, the story's own, else the desk's) over its headline.
  const splash = paper.filed[0];
  const lead = splash ? (
    <>
      {splash.image !== null ? (
        <Drawing story={splash} />
      ) : hasPicture(splash) ? (
        <StoryFace story={splash} clubs={clubs} rank="splash" />
      ) : paper.stories[0] ? (
        <Picture lead={paper.stories[0]} who={who} clubs={clubs} />
      ) : null}
      <Splash story={splash} />
    </>
  ) : paper.stories[0] ? (
    <Lead lead={paper.stories[0]} who={who} clubs={clubs} />
  ) : null;

  return (
    // The second column is the SIDEBAR; "rail" is the desk's nav.
    <>
      {/* Read's strip, in the paper's own small capitals, over a masthead it leaves alone. */}
      <ReadViews current="gazetta" register="paper" />
      <Masthead
        at={paper.snapshot?.fetchedAt ?? null}
        lock={paper.deadline ? { gameweek: lockGameweek, at: paper.deadline.locksAt } : null}
      />

      <div className="grid gap-5 @3xl:grid-cols-[1fr_19rem] @3xl:gap-x-10">
        {/* The lead column: no gutter beside the sidebar, so a full-bleed picture stops at its edge. */}
        <div className="flex flex-col gap-5 @3xl:[--page-gutter:0px]">
          {/* The lead is journalism at all times, as a headline: the article is at `/paper/{slug}`.
              A filed column leads over the desk's own story and keeps the desk's picture. */}
          {lead !== null ? (
            // A phone stacks the three ranks; from 28rem the stories are one grid of equal cards,
            // the lead across two columns, and two rows too from 42rem, where the grid is three wide.
            <div className="@container/stories">
              <div className="flex flex-col gap-5 @md/stories:grid @md/stories:grid-cols-2 @md/stories:gap-x-5 @md/stories:gap-y-6 @2xl/stories:grid-cols-3">
                <div
                  className={`flex flex-col gap-5 @md/stories:gap-3 ${
                    shoulders.length + briefs.length === 0
                      ? "@md/stories:col-span-full"
                      : "@md/stories:col-span-2 @2xl/stories:row-span-2"
                  }`}
                >
                  {lead}
                </div>

                {/* The shoulders, abreast on a phone and the lead's own column on a desk. `grid-flow-col`
                    so a lone one takes a phone's full measure rather than half of it. */}
                {shoulders.length > 0 ? (
                  <div className="grid auto-cols-fr grid-flow-col gap-x-5 @md/stories:contents">
                    {shoulders.map((story) => (
                      <Teaser key={story.slug} story={story} clubs={clubs} pictured={shouldersPictured} />
                    ))}
                  </div>
                ) : null}

                {/* The rest: rows on a phone, cards on a desk. */}
                {briefs.length > 0 ? (
                  <ul className="@md/stories:contents">
                    {briefs.map((story) => (
                      <Brief key={story.slug} story={story} clubs={clubs} />
                    ))}
                  </ul>
                ) : null}
              </div>
            </div>
          ) : null}

          {/* Which kind of nothing decides the sentence. */}
          {paper.silence ? <Silence silence={paper.silence} /> : null}

        </div>

        {/* The sidebar: the week's eleven, the three tables, who signed whom and
            when the lock is. On a phone it follows the lead with the eleven and two tables. */}
        <div className="flex flex-col gap-5 @3xl:border-l @3xl:border-line @3xl:pl-6">
          {paper.eleven ? (
            <TeamOfTheWeek
              eleven={paper.eleven}
              mine={mine}
              partial={paper.partial}
              fielded={paper.fielded}
            />
          ) : null}

          {/* Printed copies, not links: the sortable versions live on their own tabs. */}
          <PaperTable title="Top points" rows={scorers} />
          <PaperTable title="The draft table" rows={draft} />
          {/* Desk only: a phone has the Prem tab for the table, Mail for the deals and the masthead for the lock. */}
          <div className="hidden flex-col gap-5 @3xl:flex">
            <PaperTable title="The Premier League" aside="P · GD · Pts" rows={football} />

            {paper.business.length > 0 ? (
              <Deals deals={paper.business} who={dealWho} />
            ) : null}

            {paper.deadline ? (
              <Column title="Next deadline">
                <p className="text-sm text-muted">
                  {lockGameweek === undefined ? "Line-ups" : `Gameweek ${lockGameweek} line-ups`} lock{" "}
                  <span className="numeric font-semibold text-ink">{londonDayAndTime(paper.deadline.locksAt)}</span>.
                </p>
              </Column>
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
}
