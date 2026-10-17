import { spelt } from "@epl/core";
import { orDegraded } from "../../refusals";
import { subjectTitle } from "../../titles";
import { PLAYER_TAB_LABEL, type PlayerTab } from "./PlayerTabs";
import { subject, type Subject } from "./subject";

/** `generateMetadata` for one of a player's tabs: "Pascal Groß · Data", the tab alone when his profile was refused.
 *  The same cached profile read the page makes, so a title costs Fantrax nothing. */
export function playerTitle(tab: PlayerTab) {
  return subjectTitle(
    ({ fantraxId }: { fantraxId: string }) =>
      orDegraded(subject(fantraxId).then((found) => ("unavailable" in found ? null : shown(found) || null)), () => null),
    PLAYER_TAB_LABEL[tab],
  );
}

/** His name as the bar prints it: FPL's spelling where it is the same name (`spelt`). */
function shown({ intel, football }: Subject): string {
  return football ? spelt(intel.name, football.player) : intel.name;
}
