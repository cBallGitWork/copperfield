"use client";

import type { ReactNode } from "react";
import type { LeaguePlayerState, RosterLimits, RosteredTeam, SquadPlayerDetail } from "@epl/core";
import LineupPitch from "./LineupPitch";
import ListAndPitch from "./ListAndPitch";
import type { View } from "./ViewToggle";
import PlayerCard from "./PlayerCard";
import Pending from "./Pending";
import SquadRows from "./SquadRows";
import PlanStatus from "./PlanStatus";
import SaveBar from "./SaveBar";
import LeaveGuard from "./LeaveGuard";
import { useSave } from "./useSave";
import { usePlanner } from "./usePlanner";
import OutLink from "../shell/OutLink";

// Planning a lineup and saving it: the shape lives in browser state until Save sends it to Fantrax
// (`squad/[teamId]/save.ts`); where saving is off, the link at the bottom hands the manager over.
// Every rule is the commissioner's, from `getLeagueInfo` via `moves.ts`; no shape is assumed here. List and pitch are a
// rival's sheet's (`ListAndPitch`, `SquadRows`), so your own list looks exactly like everyone else's.

export default function LineupPlanner({
  team,
  details,
  players,
  limits,
  fantraxUrl,
  pending,
  period,
  benchRanks,
  canSave,
  picker,
  opens = "pitch",
}: {
  team: RosteredTeam;
  /** The squad's football detail, flat; arranged here, move by move. */
  details: SquadPlayerDetail[];
  /** A plain array, not the `Eligibility` map: it crosses the server boundary. */
  players: LeaguePlayerState[];
  limits: RosterLimits;
  fantraxUrl: string;
  /** Points Fantrax has not credited yet, or null when there are none; never a nought. */
  pending: number | null;
  /** The period being planned, which a save must still find open. */
  period: number;
  /** The order Fantrax will bring the bench on, `scorerId → rank`. */
  benchRanks: Record<string, number>;
  /** Whether this deployment saves to Fantrax. */
  canSave: boolean;
  /** The gameweek picker, beside the toggle; a tap away goes through `LeaveGuard` like any link. */
  picker: ReactNode;
  /** The view a phone opens on: the pitch, unless the page's `?view=` names the list. */
  opens?: View;
}) {
  const {
    rows,
    bench,
    eligibleBy,
    nameOf,
    dirty,
    broken,
    empty,
    doubts,
    card,
    setCard,
    pickStateOf,
    pick,
    note,
    openings,
    place,
    reset,
    markSaved,
    plan,
  } = usePlanner(team, details, players, limits, benchRanks);
  const { saving, answer, save, clear } = useSave(period, plan, markSaved);

  return (
    <div className="flex flex-col gap-3">
      {/* Why a tap on a dimmed card did nothing, on a plate while it says so; always in the page, so a screen reader
          hears it change, and out of the flow while silent. */}
      <p role="status" className={note === null ? "sr-only" : "cm-panel px-2 py-0.5 text-2xs text-ink"}>
        {note}
      </p>

      <ListAndPitch
        opens={opens}
        beside={
          <>
            <Pending points={pending} />
            {picker}
          </>
        }
        list={
          <SquadRows
            lines={rows.map((line) => ({ position: line.label, players: line.players }))}
            bench={bench}
            eligibility={eligibleBy}
            onOpen={setCard}
            doubted={doubts}
          />
        }
        pitch={
          <LineupPitch
            inColumn
            rows={rows}
            bench={bench}
            pickStateOf={pickStateOf}
            onPick={pick}
            openings={openings}
            onPlace={place}
          />
        }
      />

      {card !== null ? (
        <PlayerCard
          key={card.rostered.slot.fantraxId}
          player={card}
          eligible={eligibleBy[card.rostered.slot.fantraxId]}
          onClose={() => setCard(null)}
        />
      ) : null}

      <SaveBar
        dirty={dirty}
        canSave={canSave}
        legal={broken.length === 0}
        saving={saving}
        answer={answer}
        onSave={save}
        onReset={() => {
          reset();
          clear();
        }}
      />
      <PlanStatus broken={broken} empty={empty} doubts={doubts} nameOf={nameOf} />
      <LeaveGuard dirty={dirty} canSave={canSave && broken.length === 0} onSave={save} />

      <OutLink href={fantraxUrl}>Set this line-up in Fantrax</OutLink>
    </div>
  );
}
