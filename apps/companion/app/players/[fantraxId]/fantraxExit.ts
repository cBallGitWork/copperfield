import { FANTRAX_LEAGUE_ID, FANTRAX_PLAYER_BASE, FANTRAX_ROSTER_PATH } from "@epl/core";
import { fantraxPage } from "../../fantraxPages";

/** The way out to Fantrax in a word, beside his born line, for what the reader can do: a rival's man opens his owner's roster with
 *  Fantrax's trade panel up (`tx`, off Craig's URL); a free agent or the reader's own opens his page. */
export function fantraxExit(fantraxId: string, owner: string | null, reader: string | null): { label: string; href: string } {
  if (owner !== null && owner !== reader) {
    return { label: "Trade", href: `${fantraxPage(FANTRAX_ROSTER_PATH)};teamId=${owner}?tx=true` };
  }
  return {
    label: owner === null ? "Claim" : "Fantrax",
    href: `${FANTRAX_PLAYER_BASE}/${fantraxId}/${FANTRAX_LEAGUE_ID}`,
  };
}
