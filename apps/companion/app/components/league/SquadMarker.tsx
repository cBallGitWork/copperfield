import type { SquadPlayerDetail } from "@epl/core";
import { DASH, isGoalkeeper, isResolved, pitchName } from "@epl/core";
import PitchMarker from "./PitchMarker";
import { positionLabel } from "../../positions";

// One man of a fantasy squad as a marker on the grass: a roster slot translated into `PitchMarker`'s football terms.
// The caller keeps the button round it, since what a tap does differs.

/** A fantasy squad's key on the grass and the bench, and the position its bench strip prints over a reserve. */
export const squadKey = (player: SquadPlayerDetail) => player.rostered.slot.fantraxId;
export const squadBench = {
  keyOf: squadKey,
  captionOf: (player: SquadPlayerDetail) => positionLabel(player.rostered.slot.position) ?? DASH,
  label: "Bench",
};

export default function SquadMarker({
  player,
  show,
  eager,
}: {
  player: SquadPlayerDetail;
  /** What the line under his name carries — see `PitchMarker`. */
  show?: "points" | "fixture";
  /** Load the kit at once — see `PlayerShirt`. */
  eager?: boolean;
}) {
  const { rostered } = player;
  return (
    <PitchMarker
      player={isResolved(rostered) ? rostered.player : null}
      label={positionLabel(rostered.slot.position) ?? "?"}
      name={pitchName(rostered)}
      // `isGoalkeeper`, never a literal `"G"`: the position letters are league data a commissioner can change.
      keeper={isGoalkeeper(rostered.slot.position)}
      club={player.club}
      opposition={player.opposition}
      points={player.points}
      show={show}
      eager={eager}
    />
  );
}
