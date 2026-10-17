import { LEAGUE_NAME } from "@epl/core";
import type { Silence as SilenceState } from "../../edition";
import { UNAVAILABLE } from "../../config";
import { STANDING_HEAD } from "./heads";
import StoryHead from "./StoryHead";

// The paper with nothing to print: which nothing it is decides the headline, so the three never share a panel.

export default function Silence({ silence }: { silence: SilenceState }) {
  switch (silence.kind) {
    case "unavailable":
      return <Quiet tell={LEAGUE_NAME} headline={UNAVAILABLE} code={silence.code} />;
    case "undrafted":
      return <Quiet tell={`${LEAGUE_NAME} has not drafted`} headline="No news yet" />;
    case "quiet":
      return <Quiet tell={LEAGUE_NAME} headline="A quiet week" />;
  }
}

/** A silence set as the sheet sets a story: the tell as a standing head, then a headline in the paper's faces;
 *  the desk's `shell/Nothing` is in the desk's. `code` is the failed read, for an inspector. */
function Quiet({ tell, headline, code }: { tell: string; headline: string; code?: string }) {
  return (
    <section className="flex flex-col" data-code={code}>
      <p className={STANDING_HEAD}>{tell}</p>
      <StoryHead headline={headline} standfirst="" rank="front" />
    </section>
  );
}
