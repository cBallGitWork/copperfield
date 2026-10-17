import { holderOf, type Held, type Holder as HolderLine } from "./holder";

// Who holds a man, as every Data board's lead prints it after his name.

const HOLDER_INK: Record<HolderLine["tone"], string> = {
  yours: "font-bold text-accent",
  rival: "text-muted",
  free: "font-bold text-ink",
};

/** Who holds him, in brackets: "Yours" in the accent, a rival quiet, and Fantrax's own code for a man anybody can
 *  claim (FA, WW), loud. `className` is the width it shows at. */
export function Holder({
  held,
  teamNames,
  reader,
  className,
  filtered,
}: {
  held: Held;
  teamNames: ReadonlyMap<string, string>;
  reader: string | null;
  className: string;
  /** The statuses the board is filtered to: one alone needs no tag on every row. */
  filtered?: readonly string[];
}) {
  const holder = holderOf(held, teamNames, reader, filtered);
  if (holder === null) return null;
  return (
    <span className={`min-w-0 truncate text-2xs ${HOLDER_INK[holder.tone]} ${className}`} title={holder.title}>
      ({holder.text})
    </span>
  );
}
