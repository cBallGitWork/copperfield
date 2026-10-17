import { spelt, type FootballPlayer } from "@epl/core";
import type { PoolRow } from "./pool";

/** A pool row in FPL's spelling of his name ("Pascal Groß", not Fantrax's "Gross, Pascal"), in both name fields so a
 *  phone initials the same spelling; a man FPL calls something else keeps Fantrax's two. Identity is untouched. */
export function footballNamed(row: PoolRow, player: FootballPlayer): PoolRow {
  const name = spelt(row.entry.player.displayName, player);
  if (name === row.entry.player.displayName) return row;
  return { ...row, entry: { ...row.entry, player: { ...row.entry.player, rawName: name, displayName: name } } };
}
