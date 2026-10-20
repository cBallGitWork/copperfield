import type { FootballSnapshot, PublishedStory } from "@epl/core";
import BinXi from "./BinXi";
import DraftReport from "./DraftReport";
import Reports from "./Reports";
import Ranks from "./Ranks";
import Lineups from "./Lineups";
import TeamNews from "./TeamNews";
import { shortName } from "../../teamNames";

// What a column filed beside its prose, by kind; each returns null on an empty list, so no heading prints empty.

export default function Extras({
  story,
  named,
  mine,
  snapshot = null,
}: {
  story: PublishedStory;
  named: (teamId: string) => string;
  mine: string | null;
  /** The football a report's and the Bin XI's pitches stand on. */
  snapshot?: FootballSnapshot | null;
}) {
  if (story.kind === "season-rankings") return <Ranks story={story} named={named} mine={mine} />;
  if (story.kind === "presser") return <TeamNews story={story} myName={mine === null ? null : shortName(mine, named(mine))} />;
  if (story.kind === "predicted-xi") return <Lineups story={story} named={named} mine={mine} />;
  if (story.kind === "match-report") return <Reports story={story} snapshot={snapshot} />;
  if (story.kind === "bin-xi") return <BinXi story={story} snapshot={snapshot} />;
  if (story.kind === "draft-report") return <DraftReport story={story} snapshot={snapshot} />;
  return null;
}
