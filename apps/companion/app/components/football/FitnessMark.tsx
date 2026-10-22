import type { FootballPlayer } from "@epl/core";
import { fitnessOf } from "./doubtRow";
import StateMark from "./StateMark";
import FitnessNote, { type NotedPlayer } from "./FitnessNote";

/** CM's mark after a man's name and the note after it, "Knee · GW10"; silent for a fit man and one the bridge has
 *  not settled. Every player row's one fitness piece. */
export default function FitnessMark({ player }: { player: FootballPlayer | null }) {
  const { mark } = fitnessOf(player);
  return mark === null ? null : (
    <>
      <StateMark availability={mark} />
      <FitnessNote player={notedOf(player)} />
    </>
  );
}

/** The four fields the note reads, so a server row hands the client note no more of the footballer than that. */
export function notedOf(player: FootballPlayer | null): NotedPlayer | null {
  return player === null ? null : { code: player.code, status: player.status, news: player.news, chanceOfPlaying: player.chanceOfPlaying };
}
