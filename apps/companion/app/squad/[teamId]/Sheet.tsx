import type { BreakdownLine, PlayerStory, SquadDetailLine, SquadPlayerDetail } from "@epl/core";
import type { ReactNode } from "react";
import TeamSheet from "../../components/league/TeamSheet";
import type { View } from "../../components/league/ViewToggle";
import Pending from "../../components/league/Pending";
import ListAndPitch from "@/app/components/league/ListAndPitch";
import { PITCH_CAPTION } from "@/app/desk";
import { sheetCaption } from "./caption";
import type { AutoSubMark } from "../../components/league/autoSubbed";

// A read-only eleven, a rival's once his lineups lock or your own in any week but the open one, with the
// Pitch/List control and the gameweek picker.

export default function Sheet({
  rows,
  bench,
  breakdown,
  played,
  news,
  pending,
  eligibility,
  picker,
  show,
  opens,
  gameweek,
  marks,
}: {
  rows: SquadDetailLine[];
  bench: SquadPlayerDetail[];
  breakdown: Record<string, BreakdownLine[]>;
  /** Each man's minutes as Fantrax counts them, keyed by Fantrax id. */
  played?: Record<string, number>;
  /** Fantrax's latest on these fifteen, keyed by Fantrax id — today's only. */
  news?: Record<string, PlayerStory>;
  /** Clean-sheet points Fantrax credits at full time and FPL already pays; null when none, never a nought. */
  pending: number | null;
  /** Eligible positions by Fantrax id, for the list's position column. */
  eligibility?: Record<string, string[]>;
  /** The gameweek picker, beside the toggle; null when the calendar cannot place the week. */
  picker: ReactNode;
  /** Under each name on the grass: his score in a locked week, his opponent in a later one. */
  show: "points" | "fixture";
  /** The view on a phone at first: a rival's list (who he has), your own pitch (as the planner opens). */
  opens: View;
  /** The gameweek on screen, which a played week's caption names beside its total; null when the calendar cannot say. */
  gameweek: number | null;
  /** Who comes on for whom at the end of the gameweek, by Fantrax id; the rows are already arranged after them. */
  marks: Record<string, AutoSubMark>;
}) {
  // No shape line (Craig, 2 Sep: "so remove 1-3-4-3"); the toggle shares the pending figure's row and the week's,
  // since stacked the grass sat 421px past the fold at 390.
  return (
    <ListAndPitch
      opens={opens}
      beside={
        <>
          <Pending points={pending} />
          {picker}
        </>
      }
      list={
        // One panel round list and pitch (Craig, 2-3 Sep 2026), so `bare` stops the list drawing a second.
        <TeamSheet
          rows={rows}
          bench={bench}
          breakdown={breakdown}
          played={played}
          news={news}
          mode="list"
          eligibility={eligibility}
          bare
          autoSubs={marks}
        />
      }
      pitch={
        // `pitch-squad`: the chrome this page keeps above a phone's filled pitch (`pitch.css`).
        <div className="pitch-squad">
          {/* A heading over the grass (Craig, 3 Sep 2026): the side as it stands, or a played week and its total. */}
          <p className={`cm-title pb-1 ${PITCH_CAPTION}`}>
            {sheetCaption(rows, show === "points" ? gameweek : null)}
          </p>
          <TeamSheet
            rows={rows}
            // No bench on the grass: a reserve has no place in a formation.
            bench={[]}
            breakdown={breakdown}
            played={played}
            news={news}
            mode="pitch"
            inColumn
            show={show}
            autoSubs={marks}
          />
        </div>
      }
    />
  );
}
