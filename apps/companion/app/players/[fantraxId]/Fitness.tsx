import { availabilityOf, londonMoment } from "@epl/core";
import Section from "../../components/shell/Section";
import FitnessLine from "./FitnessLine";
import { fitnessNote } from "./condition";
import { latestNews } from "./latestNews";
import { filedAt, storyText, type NewsItem } from "./newsItems";
import type { Subject } from "./subject";

// Whether he may miss out, at the top of his Profile (Craig, 21 Oct 2026); the newest story
// on him is a block of its own lower down, and the rest is on News.

/** Prose a step above a row's name, so a paragraph reads at arm's length. */
const PROSE = "text-base leading-relaxed text-ink lg:text-lg";

export default function Fitness({ found }: { found: Subject }) {
  const player = found.football?.player ?? null;
  const availability = availabilityOf(player);
  const note = fitnessNote(availability);

  // A fit man gets no block: CM prints nothing for a fit player (Craig, 1 Oct 2026: "just remove the chip row").
  if (note === null || player === null) return null;
  return (
    <Section title="Fitness">
      <FitnessLine player={player} availability={availability} note={note} />
    </Section>
  );
}

/** Fantrax's newest note on him, under who he is; none, no block. */
export async function LatestStory({ fantraxId }: { fantraxId: string }) {
  const story = await latestNews(fantraxId);
  if (story === null) return null;
  return (
    <Section title="News">
      <Story story={story} />
    </Section>
  );
}

/** Fantrax's newest note on him: when it was filed, then all of it; a phone gets the first paragraph (Craig, 20 Oct 2026). */
export function Story({ story }: { story: NewsItem }) {
  const iso = filedAt(story);
  return (
    <div className="flex flex-col gap-1.5">
      {iso === null ? null : (
        <time dateTime={iso} className="text-sm text-muted lg:text-base">
          {londonMoment(iso)}
        </time>
      )}
      {storyText(story).map((paragraph, index) => (
        <p key={paragraph} className={index === 0 ? PROSE : `${PROSE} max-lg:hidden`}>
          {paragraph}
        </p>
      ))}
    </div>
  );
}
