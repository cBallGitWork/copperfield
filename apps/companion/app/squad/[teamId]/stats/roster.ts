import { type FootballPlayer, type RosteredPlayer, fullPlayerName, isResolved } from "@epl/core";

/** What the stat board reads off the roster, by Fantrax id: each settled man's footballer, his name in full as every
 *  list prints it (Fantrax's stat rows say "Schade, Kevin"), and the slot DefCon prices him at. */
export function rosterFacts(players: readonly RosteredPlayer[]): {
  footballers: Record<string, FootballPlayer>;
  names: Record<string, string>;
  slots: Record<string, string[]>;
} {
  const footballers: Record<string, FootballPlayer> = {};
  const names: Record<string, string> = {};
  const slots: Record<string, string[]> = {};
  for (const rostered of players) {
    const id = rostered.slot.fantraxId;
    if (isResolved(rostered)) footballers[id] = rostered.player;
    names[id] = fullPlayerName(rostered);
    slots[id] = rostered.slot.position === null ? [] : [rostered.slot.position];
  }
  return { footballers, names, slots };
}
