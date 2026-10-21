import type { FootballPlayer } from "@epl/core";
import { fitnessOf } from "./doubtRow";
import StateMark from "./StateMark";

/** CM's mark after a man's name, asked of `fitnessOf`; silent for a fit man and one the bridge has not settled. */
export default function FitnessMark({ player }: { player: FootballPlayer | null }) {
  const { mark } = fitnessOf(player);
  return mark === null ? null : <StateMark availability={mark} />;
}
