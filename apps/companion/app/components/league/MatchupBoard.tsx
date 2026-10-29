"use client";

import { useState, type ReactNode } from "react";
import {
  DASH,
  type LeagueTeam,
  type LiveTeamScore,
  inkOn,
} from "@epl/core";
import { teamColours } from "@/app/teamColours";
import BackBar from "../shell/BackBar";
import TabStrip, { type Tab } from "../shell/TabStrip";
import TeamName from "./TeamName";
import { BAR_TITLE } from "@/app/desk";
import { yoursMark } from "@/app/mine";

// The head-to-head: both totals side by side; on Line-ups each is the control that opens his team, elsewhere a caption.
// A phone shows the open side's team; the desk shows both. The leader is never accent-tinted: accent is "yours".

type Which = "team" | "opponent";

export interface MatchupSide {
  team: LeagueTeam;
  /** Fantrax's own total, or undefined when they had none for this team. */
  score: LiveTeamScore | undefined;
  mine: boolean;
  /** One short line under his name: his men still to play, or the round's word once it is over; null says nothing. */
  line: ReactNode;
  /** His eleven with his reserves under it, drawn on the server so its joins never cross to the browser;
   *  when his lineup is not public yet, the panel saying so. */
  lineup: ReactNode;
}

export default function MatchupBoard<K extends string>({
  team,
  opponent,
  view,
  tabs,
  body,
  back,
}: {
  /** Where ← goes on a board opened cold: the gameweek's fixtures. */
  back: string;
  /** The side the URL named, and the one the board opens on. */
  team: MatchupSide;
  opponent: MatchupSide;
  /** The plate the URL is on; the first of `tabs` is the lineups, which belongs to a side. */
  view: K;
  tabs: readonly (Tab & { key: K })[];
  /** Any other view, drawn once at both widths because it is the join of both squads. */
  body: ReactNode;
}) {
  const [open, setOpen] = useState<Which>("team");
  const lineups = view === tabs[0]?.key;

  return (
    <div className="flex flex-col gap-2">
      {/* One row, read as a scoreline: each side on its own colour, its total at its own right edge. */}
      <BackBar back={back}>
        <Side side={team} open={lineups ? open === "team" : null} onOpen={() => setOpen("team")} />
        <Side side={opponent} open={lineups ? open === "opponent" : null} onOpen={() => setOpen("opponent")} />
      </BackBar>

      <TabStrip label="Match views" tabs={tabs} current={view} />

      {/* The desk shows both sides; the phone shows the open one. Each side is keyed by its
          manager, or React could reuse one side's DOM for the other's. */}
      {lineups ? (
        <>
          <div className="lg:hidden">{(open === "team" ? team : opponent).lineup}</div>
          <div className="pitch-pair hidden lg:grid lg:grid-cols-2 lg:items-start lg:gap-2">
            <div key={team.team.teamId}>{team.lineup}</div>
            <div key={opponent.team.teamId}>{opponent.lineup}</div>
          </div>
        </>
      ) : (
        body
      )}
    </div>
  );
}

/** One half of the scoreline: on Line-ups the control that opens his team, the open half marked by a bar, not a hue;
 *  a caption (`open` null) on any other view, where the half picks nothing.
 *  `ScoreFigure` may not go inside the bevel: its dimmed ink fails contrast on the grey plate, so the dash is kept by hand. */
function Side({
  side,
  open,
  onOpen,
}: {
  side: MatchupSide;
  open: boolean | null;
  onOpen: () => void;
}) {
  const points = side.score?.points ?? null;
  const colours = teamColours(side.team.teamId);
  const ink = inkOn(colours);
  const face = `relative flex min-h-16 min-w-0 flex-1 items-center lg:min-h-20 ${yoursMark(side.mine)}`;
  const body = (
    <>
      {/* Accent ink is unavailable on a colour plate, so "yours" is the left edge. The short name at 14px: nine
          capitals fit a half at 390. */}
      <span className="flex min-w-0 flex-1 flex-col px-2 text-left" style={{ color: ink }}>
        <span className={`${BAR_TITLE} text-sm lg:text-2xl`}>
          <TeamName teamId={side.team.teamId} name={side.team.name} />
        </span>
        {!side.line ? null : <span className="truncate text-2xs lg:text-sm">{side.line}</span>}
      </span>

      <span className="cm-bevel numeric flex min-h-16 w-14 shrink-0 items-center justify-center text-xl font-bold lg:min-h-20 lg:w-24 lg:text-4xl">
        {points === null ? DASH : points}
      </span>

      {/* The open half's bar, below `lg` only: on the desk both sides are on screen. */}
      {open ? <span aria-hidden className="absolute inset-x-0 bottom-0 h-1 bg-accent lg:hidden" /> : null}
    </>
  );

  if (open === null) {
    return (
      <div className={face} style={{ background: colours.primary }}>
        {body}
      </div>
    );
  }
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-pressed={open}
      aria-label={`Show ${side.team.name}`}
      className={face}
      style={{ background: colours.primary }}
    >
      {body}
    </button>
  );
}
