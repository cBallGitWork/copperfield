import type { ReactNode } from "react";
import PhotoGround from "../../../components/football/PhotoGround";
import { FootFrame } from "../../../components/shell/FootFrame";
import BackPlate from "../../../components/shell/BackPlate";
import { premFixturesHref } from "../../routes";
import MatchBar from "./MatchBar";
import MatchTabs from "./MatchTabs";
import type { MatchTab } from "./matchRoutes";
import { matchVideo, type Match } from "./match";

// The frame every match tab wears: the home ground behind it, both clubs on one bar and the tabs. The Overview
// names the ground on its own dated line (page.tsx), so the frame carries no caption.

export default async function MatchShell({
  match,
  current,
  foot,
  children,
}: {
  match: Match;
  current: MatchTab;
  /** CM's foot row of related screens (`cm0102/02.jpg`), under the panel. */
  foot?: ReactNode;
  children: ReactNode;
}) {
  const { fixture, home, away } = match;
  const video = await matchVideo(match);

  return (
    // A screen tall, so the foot row sits at the foot of a short match and follows a long one.
    <FootFrame foot={foot}>
      {/* The HOME club's ground: a fixture id says nothing about who is at home, so this is where it is known. */}
      <PhotoGround subject={home?.shortName ?? null} />
      <div className="flex items-stretch">
        {/* Opened cold, back is the round it is in, not the table. */}
        <BackPlate fallback={premFixturesHref(fixture.gameweek)} />
        <div className="min-w-0 flex-1">
          {/* `v` until a ball is kicked; FPL writes a running score from the first goal. */}
          <MatchBar
            home={home}
            away={away}
            homeScore={fixture.status === "upcoming" ? null : fixture.homeScore}
            awayScore={fixture.status === "upcoming" ? null : fixture.awayScore}
          />
        </div>
      </div>
      <MatchTabs id={fixture.id} current={current} dim={video === null ? ["highlights"] : []} />
      {/* A panel ends where its content does, and blocks keep a gap between them. */}
      <div className="flex flex-col gap-2">{children}</div>
    </FootFrame>
  );
}
