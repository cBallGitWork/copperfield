import Image from "next/image";
import {
  type Club,
  type FootballPlayer,
  type Opposition,
  type RosteredPlayer,
  crestUrl,
  fixtureLabel,
  isGoalkeeper,
  isResolved,
  kickedOff,
  londonDayAndTime,
  DASH,
} from "@epl/core";
import EmptySlot from "./EmptySlot";
import MatchClock from "../football/MatchClock";
import PlayerImage from "./PlayerImage";
import { fdrStep } from "../football/fdr";
import { positionLabel, positionsLabel } from "../../positions";
import { LABEL, QUIET_FIGURE } from "@/app/desk";

// Who the man on a card is, atop every player dialog: his photograph, his club and positions, and the fixture.
// The photograph, not a pitch card, whose name plate and points band would repeat the dialog's title bar.

export default function PlayerIdentity({
  rostered,
  eligible,
  club,
  opposition,
  started = kickedOff(opposition),
}: {
  rostered: RosteredPlayer;
  /** Every position he may play, as his row prints them (`M/F`); absent, his slot. */
  eligible?: readonly string[];
  club: Club | undefined;
  opposition: Opposition[] | undefined;
  /** Whether his match is on, where the caller knows better than FPL's fixture status (`underway`). */
  started?: boolean;
}) {
  const slot = positionLabel(rostered.slot.position);
  return (
    <FootballerIdentity
      player={isResolved(rostered) ? rostered.player : null}
      keeper={isGoalkeeper(rostered.slot.position)}
      position={(eligible && positionsLabel(eligible)) || slot}
      club={club}
      opposition={opposition}
      started={started}
    />
  );
}

/** The same block for a man known only to football, as the FPL tab knows its picks. */
export function FootballerIdentity({
  player,
  keeper,
  position,
  club,
  opposition,
  started = kickedOff(opposition),
}: {
  player: FootballPlayer | null;
  keeper: boolean;
  /** His position as the screen he came from prints it; null for none. */
  position: string | null;
  club: Club | undefined;
  opposition: Opposition[] | undefined;
  started?: boolean;
}) {
  // Only for a single match: beside a double's two chips, one kickoff reads as the time of both.
  const kickoff = opposition?.length === 1 ? (opposition[0]?.fixture.kickoff ?? null) : null;

  return (
    <div className="flex items-center gap-3">
      <span className="w-[var(--player-card-figure)] shrink-0 overflow-hidden">
        {player ? (
          <PlayerImage player={player} club={club} keeper={keeper} kickedOff={started} />
        ) : (
          // Every slot on an open XI is tappable, so a card answers for one the bridge could not settle too.
          <EmptySlot label={position ?? "?"} />
        )}
      </span>

      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <p className="truncate text-sm text-muted">{[club?.name, position].filter(Boolean).join(" · ") || DASH}</p>
        <Fixture club={club} opposition={opposition} started={started} />
        {/* Nothing to come for a man with no fixture: "No fixture" above already says so. */}
        {opposition === undefined || opposition.length === 0 || started ? null : (
          <p className={QUIET_FIGURE}>
            {kickoff ? `Kicks off ${londonDayAndTime(kickoff)}` : "Yet to play"}
          </p>
        )}
      </div>
    </div>
  );
}

/** His club's crest, a "v", and each opponent as the squad list writes him (`LEE (A)`); shares `fdrStep`'s colour.
 *  Once on, a match is its score instead: a red difficulty chip over "BHA 5–0 CRY" read as the result (UX-10). */
function Fixture({
  club,
  opposition,
  started,
}: {
  club: Club | undefined;
  opposition: Opposition[] | undefined;
  started: boolean;
}) {
  // Scores only once FPL has a match kicked off: Fantrax can credit him while FPL still says upcoming.
  const scored = started && opposition?.some((against) => against.fixture.status !== "upcoming");
  return (
    <p className="flex flex-wrap items-center gap-1.5">
      {club === undefined ? null : (
        // Decorative: the line above names his club in full.
        <Image src={crestUrl(club)} alt="" width={18} height={18} className="shrink-0" />
      )}
      {opposition === undefined || opposition.length === 0 ? (
        <span className={LABEL}>No fixture</span>
      ) : scored ? (
        opposition.map((against) => <Score key={against.fixture.id} club={club} against={against} />)
      ) : (
        <>
          <span className="text-2xs text-faint">v</span>
          {/* One chip per fixture: none in a blank gameweek, two in a double, each rated on its own. */}
          {opposition.map((against) => (
            <Chip key={against.fixture.id} against={against} plain={started} />
          ))}
        </>
      )}
    </p>
  );
}

/** One match he is in once it has kicked off, home side first, as a scoreline reads: the minute while it runs, FT after. */
function Score({ club, against }: { club: Club | undefined; against: Opposition }) {
  const { fixture } = against;
  // A double's match still to come keeps its chip.
  if (fixture.status === "upcoming") return <Chip against={against} />;
  const his = club?.shortName ?? DASH;
  const [home, away] = against.home ? [his, against.club.shortName] : [against.club.shortName, his];
  return (
    // A span: it sits in the fixture line's paragraph, and a paragraph in a paragraph breaks hydration.
    <span className="numeric flex items-baseline gap-1.5 text-sm">
      <span className="font-bold text-ink">
        {home} {fixture.homeScore ?? DASH}–{fixture.awayScore ?? DASH} {away}
      </span>
      <MatchClock fixture={fixture} />
    </span>
  );
}

/** One opponent as the squad list writes him, on his difficulty step; plain once his match is on (UX-10). */
function Chip({ against, plain = false }: { against: Opposition; plain?: boolean }) {
  if (plain) return <span className="numeric text-sm font-bold leading-snug text-ink">{fixtureLabel([against])}</span>;
  return (
    <span
      className={`numeric px-1.5 py-0.5 text-sm font-bold leading-snug ${fdrStep(against.difficulty).ink}`}
      style={{ backgroundColor: fdrStep(against.difficulty).ground }}
    >
      {fixtureLabel([against])}
    </span>
  );
}
