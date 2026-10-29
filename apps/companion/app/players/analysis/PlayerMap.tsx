import type { Club, Touch } from "@epl/core";
import { clubColoursOf, plateOn } from "@epl/core";
import HeatPitch from "./HeatPitch";
import { touchCount } from "../[fantraxId]/maps";
import { MAP_CAPTION } from "@/app/desk";

// One man's pitch, shaded where he played, under a strip in his club's colours: a pitch each, the same way round.

export default function PlayerMap({
  name,
  club,
  touches,
  matches,
  id,
}: {
  name: string;
  /** His club, whose colours carry the strip over his pitch. */
  club: Club | undefined;
  /** His touches as points, or a past season's counts by cell. */
  touches: readonly Touch[] | ReadonlyMap<number, number>;
  /** How many fixtures the marks came from, for the caption; null where the season's file does not say. */
  matches: number | null;
  /** Unique per pitch on the page: an SVG filter id is global to the document. */
  id: string;
}) {
  const plate = plateOn(clubColoursOf(club));
  const count = touchCount(touches);
  const across = matches === null ? "" : ` · ${matches} ${matches === 1 ? "match" : "matches"}`;

  return (
    <figure className="flex min-w-0 flex-col gap-1">
      <figcaption
        className={MAP_CAPTION}
        style={{ background: plate.background, color: plate.ink }}
      >
        <span className="min-w-0 truncate">{name}</span>
        {/* Volume in words: every map is normalised to its own busiest cell, so the pitch does not carry it. */}
        <span className="numeric shrink-0">{count === 0 ? "no touches recorded" : `${count} touches${across}`}</span>
      </figcaption>

      <HeatPitch
        touches={touches}
        id={id}
        label={
          count === 0
            ? `No touch map recorded for ${name}`
            : `Where ${name} touched the ball${matches === null ? "" : `, across ${matches} matches`}. He attacks to the right.`
        }
      />
    </figure>
  );
}
