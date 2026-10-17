// Our match rating in the words a paper would use, never the figure: the paper prints no workings (Craig, 12 Oct 2026).
// The bands sit on the season's spread: a median of 4.5, a tenth of marks at 7 or more, a match's best at a median 8.

/** The best mark in his match, or one at the top or the bottom of the spread, as words; null when it says nothing. */
export function markWords(mark: number | null, best: boolean): string | null {
  if (mark === null) return null;
  if (best && mark >= 7) return "the best player on the pitch";
  if (mark >= 7) return "one of the best on the pitch";
  if (mark <= 3) return "one of the poorest on the pitch";
  return null;
}

/** "Brighton 3-1 Wolves" once both scores are in, else "Brighton v Wolves". */
export function resultLabel(home: string, away: string, homeScore: number | null, awayScore: number | null): string {
  return homeScore === null || awayScore === null ? `${home} v ${away}` : `${home} ${homeScore}-${awayScore} ${away}`;
}
