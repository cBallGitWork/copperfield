import type { Club, Story } from "@epl/core";
import Picture from "./Picture";
import { written } from "./sentences";
import StoryHead from "./StoryHead";

// The desk's own lead, when nothing has been filed: its picture, headline and standfirst.
// `gazette/stories.ts` ranks the stories and `sentences.ts` writes the words.

export default function Lead({
  lead,
  who,
  clubs,
}: {
  lead: Story;
  who: (teamId: string | null) => string;
  /** The gameweek's clubs, keyed by FPL id, for the one story that has a face in
   *  it. Empty is ordinary and costs the cut-out its kit, not the lead. */
  clubs: Map<number, Club>;
}) {
  const { headline, standfirst } = written(lead, who);

  return (
    <section className="flex flex-col">
      <Picture lead={lead} who={who} clubs={clubs} />
      <div className="mt-3 flex flex-col">
        <StoryHead headline={headline} standfirst={standfirst} rank="front" />
      </div>
    </section>
  );
}
