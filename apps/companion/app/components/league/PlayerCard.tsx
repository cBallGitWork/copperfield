"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  type BreakdownLine,
  type PlayerStory,
  type SquadPlayerDetail,
  isResolved,
  fullPlayerName,
  kickedOff,
  londonDayAndDate,
  londonTime,
  matchesOver,
  DASH,
} from "@epl/core";
import DialogFoot from "../shell/DialogFoot";
import DialogHead from "../shell/DialogHead";
import PlayerName from "../shell/PlayerName";
import Modal from "../shell/Modal";
import Chevron from "../shell/Chevron";
import Breakdown from "./Breakdown";
import FullMatchStats from "./FullMatchStats";
import Note from "./Note";
import WeekStrip from "./WeekStrip";
import PlayerIdentity from "./PlayerIdentity";
import { underway } from "./underway";
import { FIGURE_HEADS, type SquadFigure } from "./squadFigure";
import { fitnessOf } from "../football/doubtRow";
import FitnessLine from "../../players/[fantraxId]/FitnessLine";
import { unresolvedReason } from "../../unresolved";
import { playerHref } from "../../players/routes";
import { latestNews } from "../../players/[fantraxId]/latestNews";
import { cardRecord } from "../../players/[fantraxId]/cardRecord";
import { handedWeeks, type CardWeeks } from "../../players/[fantraxId]/cardWeeks";
import { filedAt, inbox, noteBody, type NewsItem } from "../../players/[fantraxId]/newsItems";
import { LABEL, QUIET_FIGURE } from "@/app/desk";

// The app's one player card, over whatever list or pitch he was tapped on: who he is, whether he is fit, his form and
// run to come, and Fantrax's latest folded. Handed a gameweek's breakdown, it itemises his points there too.

/** A gameweek's scoring, from a screen that has it: the table, his minutes, and whether he is on the bench. */
export interface CardScore {
  /** His categories, largest first; empty both on nought and where the table omits him, which `points` tells apart. */
  breakdown: BreakdownLine[];
  /** Fantrax's count of his minutes this gameweek; null where it stated none. */
  played?: number | null;
  /** Priced, but not counted: the live table lists only the active eleven. */
  reserve?: boolean;
}

export default function PlayerCard({
  player: { rostered, club, opposition, points, minutes },
  eligible,
  figure = "season",
  breakdown,
  played = null,
  reserve = false,
  story = null,
  autoSub = null,
  onClose,
}: Partial<CardScore> & {
  player: SquadPlayerDetail;
  /** Every position he may play, as the row he came from prints them; absent, his slot. */
  eligible?: readonly string[];
  /** What `points` holds, as the row he came from heads it: FPts, Proj or GW. */
  figure?: SquadFigure;
  /** Fantrax's latest on him, handed in by a screen that read it; null, the card reads it on open. */
  story?: PlayerStory | null;
  /** What his auto sub is, in one line; null when he has none. */
  autoSub?: string | null;
  onClose: () => void;
}) {
  const fantraxId = rostered.slot.fantraxId;
  const footballer = isResolved(rostered) ? rostered.player : null;
  const router = useRouter();
  const news = useLatest(fantraxId, story);
  const weeks = useWeeks(fantraxId);
  const over = matchesOver(opposition);
  // Fantrax crediting him says his match is on even while FPL's fixtures are held from before kickoff (19 Oct 2026).
  const started = breakdown === undefined ? kickedOff(opposition) : underway(opposition, { breakdown, played });
  // The breakdown says "Did not play."; an empty drop-down under it would say it again.
  const satOut = over && breakdown?.length === 0 && (points === 0 || points === null) && !played;

  return (
    <Modal
      onClose={onClose}
      width="24rem"
      closesOnBack
      head={
        <DialogHead
          title={<PlayerName name={fullPlayerName(rostered)} />}
          club={club?.shortName ?? null}
          onClose={onClose}
        />
      }
      foot={<DialogFoot href={playerHref(fantraxId)} onClose={onClose} />}
    >
      <div className="flex flex-col gap-2 p-3">
        <PlayerIdentity rostered={rostered} eligible={eligible} club={club} opposition={opposition} started={started} />

        {autoSub === null ? null : <p className="cm-panel px-3 py-2 text-2xs text-info">{autoSub}</p>}

        {/* Silent for a fit man: a "no news" panel on every card is noise. */}
        {fitnessOf(footballer).mark === null || footballer === null ? null : (
          <div className="cm-panel">
            <FitnessLine player={footballer} boxed={false} />
          </div>
        )}

        {isResolved(rostered) ? null : <Note>{unresolvedReason(rostered.unresolved)}</Note>}

        {/* Nothing before he has been on: an empty table under a live score reads as a nought. */}
        {breakdown !== undefined && started ? (
          <Breakdown
            breakdown={breakdown}
            points={points}
            reserve={reserve}
            minutes={played}
            over={over}
            onRetry={() => router.refresh()}
          />
        ) : null}

        {isResolved(rostered) && started && !satOut ? (
          <FullMatchStats
            opta={rostered.player.optaCode}
            position={rostered.slot.position}
            opposition={opposition}
            over={over}
            open={breakdown !== undefined}
          />
        ) : null}

        {/* The screen's own xMins stand in for the run until it is read, or when it cannot be. */}
        <WeekStrip
          form={weeks === undefined ? undefined : (weeks?.form ?? null)}
          next={weeks?.next ?? handedWeeks(minutes, opposition)}
          asOf={weeks?.asOf ?? minutes.find((week) => week.asOf)?.asOf ?? null}
          caption={breakdown === undefined && points !== undefined ? <Points points={points} figure={figure} /> : null}
        />

        {news ? <Story story={news} /> : null}
      </div>
    </Modal>
  );
}

/** The story handed in, or his newest Fantrax note read on open; a read that fails costs the card the block. */
function useLatest(fantraxId: string, handed: PlayerStory | null): NewsItem | null {
  const [read, setRead] = useState<NewsItem | null>(null);
  useEffect(() => {
    if (handed !== null) return;
    let open = true;
    latestNews(fantraxId).then(
      (item) => open && setRead(item),
      () => undefined,
    );
    return () => {
      open = false;
    };
  }, [fantraxId, handed]);
  return handed === null ? read : (inbox([handed])[0] ?? null);
}

/** His form and run off the Data tab's reads, once per open: undefined while out, null when it would not answer. */
function useWeeks(fantraxId: string): CardWeeks | null | undefined {
  const [weeks, setWeeks] = useState<CardWeeks | null | undefined>(undefined);
  useEffect(() => {
    let open = true;
    cardRecord(fantraxId).then(
      (answer) => open && setWeeks(answer),
      () => open && setWeeks(null),
    );
    return () => {
      open = false;
    };
  }, [fantraxId]);
  return weeks;
}

/** His points under the word his row heads them with (FPts, Proj, GW), in the reading's cyan. */
function Points({ points, figure }: { points: number | null; figure: SquadFigure }) {
  return (
    <>
      <span title={FIGURE_HEADS[figure].title}>{FIGURE_HEADS[figure].word}</span>{" "}
      <span className="numeric text-base font-bold text-info">{points ?? DASH}</span>
    </>
  );
}

/** Fantrax's newest note on him, folded to its date and headline; the rest of the story and the analysis on a tap. */
function Story({ story }: { story: NewsItem }) {
  const at = filedAt(story);
  const rest = noteBody(story);
  const head = (
    <>
      <span className="flex items-baseline gap-2">
        <span className={`flex-1 ${LABEL}`}>News</span>
        {at === null ? null : (
          <span className={QUIET_FIGURE}>
            {londonDayAndDate(at)} {londonTime(at)}
          </span>
        )}
        {rest.length === 0 ? null : <Chevron />}
      </span>
      <span className="line-clamp-2 text-sm font-bold leading-snug text-ink group-open:line-clamp-none">{story.headline}</span>
    </>
  );
  if (rest.length === 0) return <section className="cm-panel flex flex-col gap-1 px-3 py-2">{head}</section>;
  return (
    <details className="group cm-panel">
      <summary className="flex min-h-11 cursor-pointer list-none flex-col gap-1 px-3 py-2 [&::-webkit-details-marker]:hidden">
        {head}
      </summary>
      <div className="flex flex-col gap-1.5 px-3 pb-2">
        {rest.map((paragraph) => (
          <p key={paragraph} className="text-sm leading-snug text-ink">
            {paragraph}
          </p>
        ))}
      </div>
    </details>
  );
}
