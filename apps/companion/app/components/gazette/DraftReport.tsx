import { clubById, type FootballSnapshot, type PublishedStory } from "@epl/core";
import DraftMatchup from "./DraftMatchup";
import { HAIRLINES } from "./rules";

// A draft report: every match-up of the gameweek, lead first, one after another at every width.

export default function DraftReport({ story, snapshot }: { story: PublishedStory; snapshot: FootballSnapshot | null }) {
  const draft = story.extras?.draft;
  if (draft === undefined) return null;
  // The clubs dress each match-up's photograph in its kit; without them it prints the man alone.
  const clubs = snapshot === null ? undefined : clubById(snapshot);

  return (
    <div className={`flex flex-col pt-4 ${HAIRLINES}`}>
      {draft.matchups.map((m, i) => (
        <DraftMatchup key={i} matchup={m} n={i + 1} saturday={draft.cutoff === "saturday"} clubs={clubs} />
      ))}
    </div>
  );
}
