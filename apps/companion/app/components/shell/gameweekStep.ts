// Which gameweek a one-gameweek page shows, and the neighbours of anything a page steps through; lists come ascending.

/** The gameweek asked for when the page has it, else the latest under way, or the next once that one is done
 *  (Craig, 16 Oct 2026: Friday's reader wants the weekend), else the first; null with no rounds at all. */
export function openGameweek(
  rounds: readonly { gameweek: number; started: boolean; finished: boolean }[],
  asked: number | null,
): number | null {
  if (asked !== null && rounds.some((round) => round.gameweek === asked)) return asked;
  const latest = rounds.findLastIndex((round) => round.started);
  if (latest === -1) return rounds[0]?.gameweek ?? null;
  return (rounds[latest].finished ? rounds[latest + 1] : undefined)?.gameweek ?? rounds[latest].gameweek;
}

/** The entries either side of one on the page's list, null at either end; a break's missing week is stepped over. */
export function beside<T>(list: readonly T[], at: T): { previous: T | null; next: T | null } {
  const index = list.indexOf(at);
  return {
    previous: index > 0 ? list[index - 1] : null,
    next: index >= 0 && index < list.length - 1 ? list[index + 1] : null,
  };
}
