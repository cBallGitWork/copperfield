import { orDegraded } from "../../../refusals";
import { labelOf, subjectTitle } from "../../../titles";
import { clubOr404 } from "./club";
import { CLUB_TABS, type ClubTab } from "./ClubTabs";

/** `generateMetadata` for one of a club's tabs: "Arsenal · Depth", the tab alone when FPL could not be asked. */
export function clubTitle(tab: ClubTab) {
  return subjectTitle(
    ({ code }: { code: string }) => orDegraded(clubOr404(code).then(({ club }) => club.name), () => null),
    labelOf(CLUB_TABS, tab),
  );
}
