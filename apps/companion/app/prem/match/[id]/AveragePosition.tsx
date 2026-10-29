import { clubColoursOf, inkOn, DASH } from "@epl/core";
import { PITCH_BOX, toBoxY } from "@/app/components/football/pitchBox";
import { Pitch } from "@/app/components/football/ShotPitch";
import type { Club } from "@epl/core";
import { placeLabels } from "./labels";
import type { Placed } from "./labels";
import { MAP_CAPTION, SECTION_BAR } from "@/app/desk";

// Where each eleven played: every starter at SofaScore's average position, one pitch per side.
// Starters only, as a substitute's centre can come off two touches; names are HTML so they do not scale.

export default function AveragePosition({
  home,
  away,
  homeMen,
  awayMen,
  homeShape,
  awayShape,
  homeNamed,
  awayNamed,
}: {
  home: Club | undefined;
  away: Club | undefined;
  homeMen: readonly Placed[];
  awayMen: readonly Placed[];
  /** `"4-3-3"`, or null for a sheet that carried none. */
  homeShape: string | null;
  awayShape: string | null;
  /** How many the team sheet named, against however many the cloud can place — see `Side`. */
  homeNamed: number;
  awayNamed: number;
}) {
  // Absent rather than twenty-two men in the corner, for a match the export has not reached.
  if (homeMen.length === 0 && awayMen.length === 0) return null;

  return (
    <figure className="flex flex-col gap-1">
      {/* CM's blue title row, the same as the one over the shots. */}
      <figcaption className={`${SECTION_BAR} max-lg:hidden`}>
        Average position
      </figcaption>

      {/* Side by side on a desk, stacked under a thumb: two pitches in 390px are a name every forty pixels. */}
      <div className="grid gap-2 lg:grid-cols-2">
        <Side club={home} men={homeMen} shape={homeShape} named={homeNamed} />
        <Side club={away} men={awayMen} shape={awayShape} named={awayNamed} />
      </div>
    </figure>
  );
}

/** One side's eleven on its own pitch, under its own colour. */
function Side({
  club,
  men,
  shape,
  named,
}: {
  club: Club | undefined;
  men: readonly Placed[];
  shape: string | null;
  named: number;
}) {
  const colours = clubColoursOf(club);
  const ink = inkOn(colours);
  const labelled = placeLabels(men);

  return (
    <div className="flex flex-col">
      {/* The club's plate over its grass, and its formation at the right as `cm9900/19.jpg` sets it. */}
      <div
        className={MAP_CAPTION}
        style={{ background: colours.primary, color: ink }}
      >
        <span className="min-w-0 truncate">{club?.shortName ?? DASH}</span>
        {/* A man with no touches is dropped, and the plate admits it: `10 of 11`. */}
        <span className="numeric shrink-0">
          {men.length < named ? `${men.length} of ${named} · ` : ""}
          {shape ?? ""}
        </span>
      </div>

      <div
        className="relative w-full overflow-hidden"
        style={{ aspectRatio: `${PITCH_BOX.width} / ${PITCH_BOX.height}` }}
        role="img"
        aria-label={`Where ${club?.shortName ?? "the side"} played: each starter at the average of his own touches, attacking to the right.`}
      >
        <svg
          aria-hidden
          viewBox={`0 0 ${PITCH_BOX.width} ${PITCH_BOX.height}`}
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full"
        >
          <Pitch />
          {/* A name that had to sit nearer someone else is tied to its own man. */}
          {labelled.map((man) =>
            man.leader === null ? null : (
              <line
                key={man.code}
                x1={man.x}
                y1={toBoxY(man.y)}
                x2={man.leader.x}
                y2={toBoxY(man.leader.y)}
                stroke="var(--color-cream)"
                strokeWidth="1"
                opacity="0.7"
                vectorEffect="non-scaling-stroke"
              />
            ),
          )}
        </svg>

        {/* The disc and the name are two marks: `labels.ts` moves a name to clear another man; the disc never moves. */}
        {labelled.map((man) => (
          <span
            key={man.code}
            className="absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cream/70 lg:size-3"
            style={{ left: `${man.x}%`, top: `${man.y}%`, backgroundColor: colours.primary }}
          />
        ))}
        {/* Cream straight on the grass, one step over DESIGN §6's pitch floor (Craig, 23 Sep 2026). */}
        {labelled.map((man) => (
          <span
            key={man.code}
            className="absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap text-2xs font-bold leading-none text-cream lg:text-xs"
            style={{ left: `${man.labelX}%`, top: `${man.labelY}%` }}
          >
            {man.name}
          </span>
        ))}
      </div>
    </div>
  );
}
