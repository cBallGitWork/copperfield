import type { ReactNode } from "react";
import type { Club, Shot } from "@epl/core";
import type { Mark } from "../../components/football/shotGeometry";
import { clubColoursOf, howMany, plateOn } from "@epl/core";
import Marks from "../../components/football/ShotMarks";
import { KeyPassLines, KeyPassOrigins, Pitch } from "../../components/football/ShotPitch";
import { PITCH_BOX } from "../../components/football/pitchBox";
import Section from "../../components/shell/Section";
import HeatPitch from "../analysis/HeatPitch";
import { SMALL_CAPS } from "@/app/desk";
import { attackingSpan, touchCount, type SeasonMaps as Maps } from "./maps";

// His season on three pitches (Craig, 9 Oct 2026): shots and chances on the attacking half, touches on the whole.
// Two halves beside one whole pitch draw at one height, on a phone (2+2 columns) and a desk (1+1+2). A past season
// draws the same pitches off its own file, with no chances.

const CREAM = "var(--color-cream)";

export default function SeasonMaps({
  maps,
  club,
  season,
}: {
  maps: Maps;
  club: Club | undefined;
  /** A past season's label, `2023/24`; absent for this season. */
  season?: string;
}) {
  const touches = touchCount(maps.touches);
  if (maps.shots.length + maps.chances.length + touches === 0) return null;
  const when = season === undefined ? "this season" : `in ${season}`;
  const plate = plateOn(clubColoursOf(club));
  const label = (title: string, count: number, children: ReactNode, wide = false) => (
    <figure className={`flex min-w-0 flex-col gap-1 ${wide ? "col-span-2" : ""}`}>
      <figcaption
        className={`flex items-baseline justify-between gap-2 px-2 py-1 ${SMALL_CAPS}`}
        style={{ background: plate.background, color: plate.ink }}
      >
        <span className="min-w-0 truncate">{title}</span>
        <span className="numeric shrink-0">{count}</span>
      </figcaption>
      {children}
    </figure>
  );

  return (
    <Section>
      <div className="grid grid-cols-2 items-start gap-2 lg:grid-cols-4">
        {maps.shots.length === 0
          ? null
          : label("Shots", maps.shots.length, <Half shots={maps.shots} passes={null} when={when} />)}
        {maps.chances.length === 0
          ? null
          : label("Chances created", maps.chances.length, <Half shots={maps.chances} passes={maps.chances} when={when} />)}
        {touches === 0
          ? null
          : label(
              "Touches",
              touches,
              <HeatPitch touches={maps.touches} id="season" label={`Where he touched the ball ${when}, attacking right.`} />,
              true,
            )}
      </div>
    </Section>
  );
}

/** Shots on the half they were struck in; with `passes`, the same shots, each from where the key pass began. */
function Half({ shots, passes, when }: { shots: readonly Mark[]; passes: readonly Shot[] | null; when: string }) {
  const span = attackingSpan(passes ? [...shots, ...passes.flatMap((shot) => shot.pass ?? [])] : shots);
  return (
    <svg
      viewBox={`${span.x} 0 ${span.width} ${PITCH_BOX.height}`}
      className="w-full"
      role="img"
      aria-label={
        passes
          ? `The ${howMany(shots.length, "shot")} he set up ${when}, each from where his pass began.`
          : `His ${howMany(shots.length, "shot")} ${when}, attacking right.`
      }
    >
      <Pitch />
      {/* Pass lines under the marks, their origins over them. */}
      {passes ? <KeyPassLines shots={passes} colour={CREAM} /> : null}
      <Marks shots={shots} />
      {passes ? <KeyPassOrigins shots={passes} colour={CREAM} /> : null}
    </svg>
  );
}
