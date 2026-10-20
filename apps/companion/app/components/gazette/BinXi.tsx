import { byPositionDepth, clubById, isGoalkeeper, pitchName, playerByCode, plural, type FootballSnapshot, type PublishedStory } from "@epl/core";
import PitchMarker from "../league/PitchMarker";
import PitchRows from "../league/PitchRows";
import { STANDING_HEAD } from "./heads";
import { RULE } from "./rules";

// The Bin XI as the desk printed it: the eleven nobody has, on the grass with Fantrax's points, then the
// key stats. The stats list is the report sidebar's too: two uses.

export default function BinXi({ story, snapshot }: { story: PublishedStory; snapshot: FootballSnapshot | null }) {
  const bin = story.extras?.bin;
  if (bin === undefined) return null;
  const players = snapshot === null ? new Map() : playerByCode(snapshot);
  const clubs = snapshot === null ? new Map() : clubById(snapshot);
  const rows = [...new Set(bin.xi.map((man) => man.slot))]
    .sort(byPositionDepth)
    .map((slot) => ({ label: slot, players: bin.xi.filter((man) => man.slot === slot) }));

  return (
    <div className="flex flex-col gap-3 pt-4">
      <p className={STANDING_HEAD}>
        The Bin XI · {bin.shape} · <span className="numeric">{bin.total}</span> {plural(bin.total, "pt")}
      </p>
      {/* Stacked on a phone; the pitch beside its stats at a desk, where it would fill the sheet. */}
      <div className="grid gap-3 @3xl:grid-cols-2 @3xl:gap-x-8">
        <PitchRows rows={rows} keyOf={(man) => String(man.code)} inColumn>
          {(man) => {
            const player = players.get(man.code) ?? null;
            return (
              <PitchMarker
                // Null so today's injury doubt stays off a gameweek already played.
                player={null}
                label={man.slot}
                name={pitchName(player ?? { name: man.name })}
                keeper={isGoalkeeper(man.slot)}
                club={player === null ? undefined : clubs.get(player.clubId)}
                // Fantrax's points for the week, as filed: the marker only prints points once a match is live.
                band={`${man.points} ${plural(man.points, "pt")}`}
                face={player ?? undefined}
              />
            );
          }}
        </PitchRows>
        {bin.keyStats.length === 0 ? null : (
          <section className={`flex flex-col gap-1.5 self-start border-t pt-2 ${RULE}`}>
            <h2 className={STANDING_HEAD}>Key stats</h2>
            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs leading-snug text-ink">
              {bin.keyStats.map((stat) => (
                <div key={stat.label} className="contents">
                  <dt className="text-muted">{stat.label}</dt>
                  <dd className="numeric">{stat.value}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}
      </div>
    </div>
  );
}
