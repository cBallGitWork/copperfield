import { YOUTUBE_EMBED_BASE } from "@epl/core";
import TabEmpty from "../../../../components/league/TabEmpty";
import MatchShell from "../Shell";
import { matchVideo, readMatch } from "../match";
import { PANEL, QUIET_NOTE } from "@/app/desk";
import { matchTitle } from "../title";

// The match's highlights, from Sky Sports Premier League's YouTube playlist (Craig, 11 Sep 2026).
// Embedded, never fetched: YouTube's iframe plays it, and we read only titles and ids.

export const revalidate = 30;

export const generateMetadata = matchTitle("highlights");

export default async function MatchHighlightsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const match = await readMatch(id);
  const { fixture } = match;
  const video = await matchVideo(match);

  return (
    <MatchShell match={match} current="highlights">
      {/* Wrapped so `MatchShell`'s `[&>section]:flex-1` misses it and the panel fits the video. */}
      <div>
        {video === null ? (
          // TabEmpty is the panel here, so the line is not boxed twice.
          <TabEmpty code={`fixture ${fixture.code}`}>
            {fixture.status === "upcoming" ? "Not kicked off" : "No highlights"}
          </TabEmpty>
        ) : (
          <section className={PANEL}>
            <figure className="flex flex-col gap-2">
              {/* `max-w-full` on the 16:9 box, or the page scrolls sideways to hold it. */}
              <div className="aspect-video w-full max-w-full overflow-hidden border border-line">
                <iframe
                  src={`${YOUTUBE_EMBED_BASE}/${video.id}`}
                  title={video.title}
                  allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  loading="lazy"
                  className="size-full"
                />
              </div>
              {/* Their title, verbatim and credited: their cut and their words, pointed at, not republished. */}
              <figcaption className={QUIET_NOTE}>{`${video.title} · Sky Sports Premier League`}</figcaption>
            </figure>
          </section>
        )}
      </div>
    </MatchShell>
  );
}
