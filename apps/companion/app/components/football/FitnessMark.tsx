import type { Availability, FootballPlayer } from "@epl/core";
import { fitnessOf } from "./doubtRow";
import StateMark from "./StateMark";

/** CM's mark after a man's name: the `mark` a row's one `fitnessOf` gave, else asked of `player`; silent for a fit man
 *  and one the bridge has not settled. */
export default function FitnessMark({ player = null, mark }: { player?: FootballPlayer | null; mark?: Availability | null }) {
  const shown = mark === undefined ? fitnessOf(player).mark : mark;
  return shown === null ? null : <StateMark availability={shown} />;
}
