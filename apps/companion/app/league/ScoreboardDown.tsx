/** What a board says when the live scoreboard refused; the desk prints it in its own row. */
const SCORES_DOWN = "No scores right now.";

/** The live scoreboard refused: one quiet line over a board, its tell on the element. */
export default function ScoreboardDown({ refused }: { refused: string }) {
  return (
    <p className="px-3 text-2xs text-faint" data-code={refused}>
      {SCORES_DOWN}
    </p>
  );
}
