import { Suspense } from "react";
import Nothing from "../../components/shell/Nothing";
import { PANEL } from "@/app/desk";
import ButtonLink from "../../components/shell/ButtonLink";
import { POOL } from "../routes";
import { intelMinutes, intelSquads } from "../../intel";
import { XMINS_AS_OF } from "../../xmins";
import AttributeGrid from "./AttributeGrid";
import BornLine from "./BornLine";
import type { GridWord } from "./AttributeGrid";
import FixtureRun from "./FixtureRun";
import Fitness from "./Fitness";
import NoProfile from "./NoProfile";
import PlayerShell from "./PlayerShell";
import Portrait from "./Portrait";
import RealPosition from "./RealPosition";
import SetPieces from "./SetPieces";
import { playerGrid, playerPieces, playerStanding } from "./grid";
import { scouting } from "./scouting";
import { subject } from "./subject";
import { playerTitle } from "./title";

// Who he is, on Championship Manager's profile screen (`cm9900/11.jpg`): birth line, attribute grid, fitness, set
// pieces, the run to come and the cyan line saying what he plays. His figures are Data's. One Fantrax read per tap.

// Must match `PAGE_REVALIDATE` in the app's config: Next reads it statically, so it cannot be imported.
export const revalidate = 30;

export const generateMetadata = playerTitle("profile");

export default async function PlayerProfile({ params }: { params: Promise<{ fantraxId: string }> }) {
  const { fantraxId } = await params;
  const found = await subject(fantraxId);

  if ("unavailable" in found) return <NoProfile code={found.unavailable} />;

  const { intel, football } = found;
  const [grid, standing, pieces] =
    football === null
      ? [null, null, null]
      : await Promise.all([playerGrid(football.player), playerStanding(football.player), playerPieces(football.player)]);
  // What he actually plays, as the sister repo settled it; null where it has no row for him.
  const position = football === null ? null : (intelSquads.get(football.player.code) ?? null);
  // His run to come, off the snapshot and calendar every screen holds, so outside any boundary.
  const run = football === null ? null : await scouting(football.player);
  const minutes = new Map(
    (football === null ? [] : (intelMinutes.get(football.player.code) ?? [])).map((week) => [week.gameweek, week.minutes]),
  );

  return (
    <PlayerShell
      subject={found}
      fantraxId={fantraxId}
      current="profile"
    >
      {football === null ? null : <BornLine player={football.player} />}
      {/* Portrait above the grid on a phone, beside it on a desk and as tall as it (Craig, 4 Sep 2026). */}
      <div className="flex flex-col gap-2 lg:flex-row lg:items-stretch">
        {/* No portrait, and nothing in its place, for a man FPL has never listed. */}
        {football ? (
          <Portrait
            player={football.player}
            club={football.club}
            position={intel.defaultPosition}
          />
        ) : null}
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          {grid === null ? (
            <section className={PANEL}>
              <Nothing title="No attribute grid for this man" />
            </section>
          ) : (
            <AttributeGrid
              attributes={grid.attributes}
              words={words(standing)}
              season={grid.season}
              keeper={grid.keeper}
            />
          )}
        </div>
      </div>

      {/* Whether he can play and what is being said about him, under who he is (Craig, 26 Sep 2026). */}
      <Suspense fallback={null}>
        <Fitness fantraxId={fantraxId} player={football?.player ?? null} />
      </Suspense>

      {pieces === null ? null : <SetPieces pieces={pieces} club={football?.club?.name ?? null} />}

      {/* The run to come, not the round just gone (Craig, 4 Sep 2026). */}
      {run === null ? null : <FixtureRun run={run} minutes={minutes} asOf={XMINS_AS_OF} />}

      {/* What he actually plays, last and loudest, where CM puts it (Craig, 4 Sep 2026). */}
      <RealPosition position={position} />

      {/* An action on the man on screen, not a tab: the board becomes the picker for the second. */}
      <ButtonLink href={`${POOL}?compare=${fantraxId}`}>Compare with…</ButtonLink>
    </PlayerShell>
  );
}

/** CM's worded row under the ratings: the foot he shoots with, never a keeper's. Condition is Fitness's. */
function words(standing: { keeper: boolean; foot: string | null } | null): GridWord[] {
  if (standing?.keeper) return [];
  return [{ name: "Preferred Foot", value: standing?.foot ?? null, title: "the foot he shoots with, off the shot map" }];
}
