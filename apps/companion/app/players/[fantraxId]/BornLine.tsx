import type { ReactNode } from "react";
import { countryOf } from "@epl/core";
import type { FootballPlayer } from "@epl/core";
import { now } from "../../clock";
import { regions } from "../../football";
import { bornLine } from "./bio";

/** CM's `Born 2.10.79 (Age 19). English.` with the way out to Fantrax beside it (Craig, 21 Oct 2026: the status row went
 *  to the title bar, so the button rides here); a man FPL never listed gets the button alone. */
export default async function BornLine({ player, exit }: { player: FootballPlayer | null; exit: ReactNode }) {
  const born = player === null ? null : bornLine(player.birthDate, now(), countryOf(player.region, await regions()));
  return (
    <div className="cm-panel flex items-center gap-2 px-2 py-1">
      <p className="cm-title min-w-0 flex-1 font-chrome text-sm font-bold text-ink lg:text-lg">{born}</p>
      {exit}
    </div>
  );
}
