import { clubById } from "@epl/core";
import { footballNow, seasonFixtures } from "../../../football";
import { orDegraded } from "../../../refusals";
import { labelOf, subjectTitle, versus } from "../../../titles";
import { wholeNumber } from "../../../wholeNumber";
import { MATCH_TABS, type MatchTab } from "./matchRoutes";

/** `generateMetadata` for one of a match's tabs: "Arsenal v Leeds United · Stats", the tab alone when FPL could not
 *  be asked. Off the two cached reads `readMatch` starts with, not its per-round ones. */
export function matchTitle(tab: MatchTab) {
  return subjectTitle(({ id }: { id: string }) => orDegraded(fixtureName(id), () => null), labelOf(MATCH_TABS, tab));
}

async function fixtureName(id: string): Promise<string | null> {
  const wanted = wholeNumber(id);
  if (wanted === null) return null;
  const [snapshot, fixtures] = await Promise.all([footballNow(), seasonFixtures()]);
  const fixture = fixtures.find((entry) => entry.id === wanted);
  const clubs = clubById(snapshot);
  const home = fixture === undefined ? undefined : clubs.get(fixture.homeClubId);
  const away = fixture === undefined ? undefined : clubs.get(fixture.awayClubId);
  return home === undefined || away === undefined ? null : versus(home.name, away.name);
}
