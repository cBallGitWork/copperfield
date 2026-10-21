import type { ReactNode } from "react";
import TabStrip from "../components/shell/TabStrip";
import { FootFrame } from "../components/shell/FootFrame";
import { phoneShows } from "@/app/desk";
import LeaderBoard from "./LeaderBoard";
import { Holder } from "../players/BoardRow";
import type { TopBoard } from "./leaders";
import { LIVE } from "../components/shell/sections";

// This gameweek's leaders (Craig, 1 Oct 2026: "match day have 3rd tab, that shows top stats for just
// this gameweek"). A phone picks one list from a strip docked on the rail; a desk shows them all, each its own `LeaderBoard`.

/** The Live tab's third view, by its query value. */
export const STATS_VIEW = "stats";

/** Its tab's word, and the heading its lists sit under. */
export const TOP_STATS = "Top stats";

/** One list's own address; the view's plain one without a key, or for its first list. */
export function statsHref(key?: string, first?: string): string {
  return key === undefined || key === first ? `${LIVE}?view=${STATS_VIEW}` : `${LIVE}?view=${STATS_VIEW}&stat=${key}`;
}

export default function TopStats({
  boards,
  stat,
  teamNames,
  reader,
  exit,
}: {
  boards: readonly TopBoard[];
  /** The list the address asks for; a stale key shows the first. */
  stat: string | undefined;
  teamNames: ReadonlyMap<string, string>;
  reader: string | null;
  /** The way out under the boards, kept above the dock so the picker is the page's last block. */
  exit?: ReactNode;
}) {
  const first = boards[0]?.key;
  const picked = boards.find((board) => board.key === stat)?.key ?? first;
  return (
    // Fills what the page's frame leaves under the bar and the strip, so a short board's picker still sits on the rail.
    // `!` because Tailwind emits min-h-0 before FootFrame's arbitrary min-h, which would otherwise win.
    <FootFrame
      className="min-h-0! flex-1 lg:gap-0"
      foot={
        <div className="lg:hidden">
          <TabStrip
            label="Which leaders"
            tabs={boards.map(({ key, tab }) => ({ key, label: tab, href: statsHref(key, first) }))}
            current={picked ?? null}
            labels="word"
          />
        </div>
      }
    >
      {/* Between the bar's h1 and each list's h3; the lit tab already says it on screen. */}
      <h2 className="sr-only">{TOP_STATS}</h2>
      <div className="grid items-start gap-2 lg:grid-cols-3">
        {boards.map((board) => (
          <LeaderBoard
            key={board.key}
            list={board.list}
            rows={board.rows.map((row) => ({
              ...row,
              tail: row.held === null ? undefined : <Holder held={row.held} teamNames={teamNames} reader={reader} className="" />,
            }))}
            className={phoneShows(board.key === picked)}
          />
        ))}
      </div>
      {exit === undefined ? null : <div className="lg:mt-4">{exit}</div>}
    </FootFrame>
  );
}
