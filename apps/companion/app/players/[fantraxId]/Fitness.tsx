import { Suspense } from "react";
import { availabilityOf, londonMoment } from "@epl/core";
import Section from "../../components/shell/Section";
import TransferStatus from "./TransferStatus";
import { fitnessNote } from "./condition";
import { latestNews } from "./latestNews";
import { filedAt, storyText, type NewsItem } from "./newsItems";
import type { Subject } from "./subject";

// Whether he may miss out and whether he is free, at the top of his Profile (Craig, 21 Oct 2026); the newest story
// on him is a block of its own lower down, and the rest is on News.

/** Prose a step above a row's name, so a paragraph reads at arm's length. */
const PROSE = "text-base leading-relaxed text-ink lg:text-lg";

/** His fitness in one line at a row's size: a status, not a story (Craig, 21 Oct 2026: "why do we make these so big?"). */
const NOTE = "text-sm leading-snug text-ink lg:text-base";

export default function Fitness({ found, fantraxId }: { found: Subject; fantraxId: string }) {
  const note = found.football === null ? null : fitnessNote(availabilityOf(found.football.player));

  return (
    <Section title={note === null ? "Transfer" : "Fitness and transfer"}>
      {note === null ? null : <p className={NOTE}>{note}</p>}
      {/* Streamed: the line reads the league's transaction feed; the slot holds the button's height meanwhile. */}
      <Suspense fallback={<div aria-busy className="min-h-11" />}>
        <TransferStatus found={found} fantraxId={fantraxId} />
      </Suspense>
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
