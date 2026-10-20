import TurnLink from "./TurnLink";
import StoryFace, { hasPicture } from "./StoryFace";
import Dateline from "./Dateline";
import type { Club, PublishedStory } from "@epl/core";
import { storyHref } from "./paperPages";

// A shoulder: a story at the second rank, as a card: picture, headline, deck and
// dateline. Two abreast under the splash on a phone; on a desk, the column beside the lead.

export default function Teaser({
  story,
  clubs,
  pictured,
}: {
  story: PublishedStory;
  /** The gameweek's clubs, for the picture. Empty is ordinary and costs the
   *  card its kit, not its headline. */
  clubs: Map<number, Club>;
  /** Whether this row of shoulders runs pictures: twin shoulders carry them together or not at all,
   *  so the caller decides and not the story. */
  pictured: boolean;
}) {
  return (
    <article id={story.slug} className="scroll-mt-4 border-t border-line pt-3">
      <TurnLink href={storyHref(story.slug)} className="flex min-h-11 flex-col justify-center gap-1">
        {pictured && hasPicture(story) ? (
          <span className="-mt-3 mb-1 block">
            <StoryFace story={story} clubs={clubs} rank="card" />
          </span>
        ) : null}
        {/* A long word ('domeitalycoach') hyphenates or breaks inside a 138px shoulder rather than off the page. */}
        <h3 className="paper-display text-balance wrap-anywhere max-lg:hyphens-auto text-xl font-black leading-[1.08] text-ink @md/stories:text-2xl">
          {story.headline}
        </h3>
        {story.deck !== "" ? (
          <p className="text-sm italic leading-snug text-muted">{story.deck}</p>
        ) : null}
        <Dateline story={story} as="span" byline={false} />
      </TurnLink>
    </article>
  );
}
