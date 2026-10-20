import { type CompetitionTie, type LiveTeamScore, type RoundState, groupTies, londonTime } from "@epl/core";
import { tieSide } from "../components/league/tieSide";
import { toPlayWord } from "../components/league/toPlay";
import { draftGameweek } from "../titles";
import { tieGroupTitle } from "./tieOrder";

// The gameweek's ties as a picture to send round the group: what Live's league list says, laid out for the PNG.

/** One side as the picture prints it: the phone's short name, his place, his men still to play. */
export interface ShareSide {
  name: string;
  place: string | null;
  left: string | null;
}

export interface ShareRow {
  home: ShareSide;
  away: ShareSide;
  /** Null prints the dash: a total not given is not nought. */
  score: { home: number | null; away: number | null };
}

export interface ShareGroup {
  title: string;
  rows: ShareRow[];
}

export interface ShareList {
  title: string;
  /** "as of 15:52" while the scores can move, "Full time" once the football has, "Final" once they cannot. */
  stamp: string;
  groups: ShareGroup[];
  size: { width: number; height: number };
}

/** The picture's measures in pixels: a 390-point phone at 2x, rows at the screen's own proportions. */
export const SHARE_LAYOUT = {
  width: 780,
  pad: 32,
  title: 64,
  stamp: 40,
  gap: 24,
  groupHead: 60,
  groupFoot: 20,
  row: 92,
} as const;

/** How tall the picture is for these groups: every row shows, so it grows with a cup week. */
export function shareHeight(groups: readonly { rows: readonly unknown[] }[]): number {
  const { pad, title, stamp, gap, groupHead, groupFoot, row } = SHARE_LAYOUT;
  const body = groups.reduce((sum, group) => sum + gap + groupHead + group.rows.length * row + groupFoot, 0);
  return pad + title + stamp + body + pad;
}

/** The words under the title: `takenAt` is when the scores were read. */
export function shareStamp(state: RoundState, takenAt: string): string {
  if (state === "final") return "Final";
  if (state === "provisional" || state === "bonus-settling") return "Full time";
  return `as of ${londonTime(takenAt)}`;
}

export function shareList({
  ties,
  scores,
  places,
  gameweek,
  state,
  takenAt,
}: {
  ties: readonly CompetitionTie[];
  scores: Map<string, LiveTeamScore>;
  places: Map<string, string>;
  gameweek: number;
  state: RoundState;
  takenAt: string;
}): ShareList {
  // The league's own order: the picture goes to everybody, so nobody's tie leads it.
  const groups = groupTies(ties).map((group) => ({
    title: tieGroupTitle(group),
    rows: group.ties.map((tie) => row(tie, scores, places)),
  }));
  return {
    title: draftGameweek(gameweek),
    stamp: shareStamp(state, takenAt),
    groups,
    size: { width: SHARE_LAYOUT.width, height: shareHeight(groups) },
  };
}

function row(tie: CompetitionTie, scores: Map<string, LiveTeamScore>, places: Map<string, string>): ShareRow {
  const side = (seat: CompetitionTie["home"]): ShareSide => {
    const id = seat.team?.teamId;
    const drawn = tieSide(seat, places, null, { left: toPlayWord(scores.get(id ?? "")?.toPlay, true) });
    return { name: drawn.short ?? drawn.name, place: drawn.place ?? null, left: drawn.left ?? null };
  };
  const points = (seat: CompetitionTie["home"]) =>
    seat.team === null ? null : (scores.get(seat.team.teamId)?.points ?? null);
  return { home: side(tie.home), away: side(tie.away), score: { home: points(tie.home), away: points(tie.away) } };
}
