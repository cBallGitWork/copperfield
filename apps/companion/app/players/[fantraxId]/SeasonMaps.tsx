import type { ReactNode } from "react";
import type { Club, Shot } from "@epl/core";
import type { Mark } from "../../components/football/shotGeometry";
import { clubColoursOf, fixed, howMany, plateOn } from "@epl/core";
import Marks, { TierGlyph } from "../../components/football/ShotMarks";
import { TIER } from "../../components/football/shotGeometry";
import { KeyPassLines, KeyPassOrigins, Pitch } from "../../components/football/ShotPitch";
import { PITCH_BOX } from "../../components/football/pitchBox";
import Absent from "../../components/shell/Absent";
import Section from "../../components/shell/Section";
import HeatPitch from "../analysis/HeatPitch";
import { MAP_CAPTION } from "@/app/desk";
import { attackingSpan, shotBreakdown, touchCount, type SeasonMaps as Maps } from "./maps";

// His season on three pitches (Craig, 9 Oct 2026): shots and chances on the attacking half, touches on the whole.
// Two halves beside one whole pitch draw at one height, on a phone (2+2 columns) and a desk (1+1+2). A past season
// draws the same pitches off its own file, with no chances. Without chances a desk runs 1+2 across three columns and a
// phone puts the shots' outcomes beside their half, as the marks' key.

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
  // The cell the chances map would fill, on a phone; a desk closes the gap instead.
  const outcomes = maps.shots.length > 0 && maps.chances.length === 0;
  const when = season === undefined ? "this season" : `in ${season}`;
  const plate = plateOn(clubColoursOf(club));
  const label = (title: string, count: number | null, children: ReactNode, extra = "") => (
    <figure className={`flex min-w-0 flex-col gap-1 ${extra}`}>
      <figcaption
        className={MAP_CAPTION}
        style={{ background: plate.background, color: plate.ink }}
      >
        <span className="min-w-0 truncate">{title}</span>
        {count === null ? null : <span className="numeric shrink-0">{count}</span>}
      </figcaption>
      {children}
    </figure>
  );

  return (
    <Section>
      <div className={`grid grid-cols-2 items-start gap-2 ${outcomes ? "lg:grid-cols-3" : "lg:grid-cols-4"}`}>
        {maps.shots.length === 0
          ? null
          : label("Shots", maps.shots.length, <Half shots={maps.shots} passes={null} when={when} />)}
        {outcomes ? label("Outcomes", null, <Outcomes shots={maps.shots} />, "lg:hidden") : null}
        {maps.chances.length === 0
          ? null
          : label("Shots set up", maps.chances.length, <Half shots={maps.chances} passes={maps.chances} when={when} />)}
        {touches === 0
          ? null
          : label(
              "Touches",
              touches,
              <HeatPitch touches={maps.touches} id="season" label={`Where he touched the ball ${when}, attacking right.`} />,
              "col-span-2",
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

/** His shots counted as the marks draw them, each beside its mark, and their xG: a key with figures. */
function Outcomes({ shots }: { shots: readonly Mark[] }) {
  const { rows, xg } = shotBreakdown(shots);
  const row = (key: string, glyph: ReactNode, label: string, value: ReactNode) => (
    <div key={key} className="flex min-h-9 items-center justify-between gap-2 border-b border-bg py-1">
      <dt className="flex items-center gap-1.5 text-sm text-muted">
        {glyph}
        {label}
      </dt>
      <dd className="numeric font-chrome text-base font-bold text-ink">{value}</dd>
    </div>
  );
  return (
    <dl className="flex flex-col px-1">
      {rows.map((each) => row(each.outcome, <TierGlyph tier={TIER[each.outcome]} />, each.label, each.count))}
      {row("xg", null, "xG", xg === null ? <Absent /> : fixed(xg, "expected"))}
    </dl>
  );
}
