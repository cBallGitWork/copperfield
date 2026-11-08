import file from "../../../data/leagues/cup-tiebreaks.json";

// A level cup tie's winner on its tie-break, as the commissioner settled it, off `data/leagues/cup-tiebreaks.json`:
// `{ "cup": "infusr", "code": "M1", "winner": "<teamId>", "how": "Through on goals scored, 3 to 2" }`. `how` is for the
// reader. Only a tie level on points reads it (`cupDraw`), and only for one of its two teams.

interface Entry {
  cup: string;
  code: string;
  winner: string;
}

/** The recorded winners for one cup, by tie code. */
export function cupTieBreaks(cup: string): ReadonlyMap<string, string> {
  return new Map((file.tieBreaks as Entry[]).filter((entry) => entry.cup === cup).map((entry) => [entry.code, entry.winner]));
}
