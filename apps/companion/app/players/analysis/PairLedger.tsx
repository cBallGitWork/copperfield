import { DASH } from "@epl/core";

// Two men's figures either side of one label, the better louder and never red; a lone man's figure, then its label.
// Centred and narrow, so each pair sits either side of its label (Craig, 24 Sep 2026).

/** One line: both men's figures, already printed, and the values that decide which is louder. */
export interface LedgerLine {
  key: string;
  label: string;
  /** What the measure is, or how it is worked out, as a tooltip. */
  from: string;
  a: number | null;
  b: number | null;
  shown: { a: string; b: string };
  lowerIsBetter?: boolean;
}

export default function PairLedger({
  lines,
  alone,
  caption,
}: {
  lines: readonly LedgerLine[];
  alone: boolean;
  caption: string;
}) {
  return (
    <table className="mx-auto w-full max-w-sm border-collapse">
      <caption className="sr-only">{caption}</caption>
      <tbody>
        {lines.map((line) => (
          <tr key={line.key} className="border-b border-line/60 last:border-b-0">
            <td className={`${LEDGER_FIGURE} pr-3 text-right ${loudness(line.a, line.b, line.lowerIsBetter)}`}>
              {line.shown.a}
            </td>
            <td
              title={line.from}
              className={`w-px whitespace-nowrap px-1 text-2xs uppercase text-muted ${alone ? "text-left" : "text-center"}`}
            >
              {line.label}
            </td>
            {alone ? null : (
              <td className={`${LEDGER_FIGURE} pl-3 text-left ${loudness(line.b, line.a, line.lowerIsBetter)}`}>
                {line.shown.b}
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** A figure as printed when it is a whole number, absence a dash. */
export function whole(value: number | null): string {
  return value === null ? DASH : String(value);
}

/** A step above the row default: DESIGN §6's fifth recorded exception, a ledger of two men's figures and nothing else. */
const LEDGER_FIGURE = "numeric cm-row py-1 text-base lg:text-lg";

/** The better amber, a tie or a lone man ink, the weaker muted, a figure only the other man has quieter still. */
function loudness(mine: number | null, theirs: number | null, lowerIsBetter = false): string {
  if (mine === null) return "text-faint";
  if (theirs === null || mine === theirs) return "text-ink";
  const better = lowerIsBetter ? mine < theirs : mine > theirs;
  return better ? "font-bold text-mid" : "text-muted";
}
