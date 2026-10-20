import { lineup, squadUnarranged, type RosterDisplay, type RosteredTeam } from "@epl/core";

/** His men's ids in the order the Squad tab prints them: the eleven by line then the bench once lineups show, else
 *  by line and name, which says nothing of who starts. `bench` is Fantrax's bench order, first-on first. */
export function squadTabOrder(team: RosteredTeam, show: RosterDisplay["show"], bench: readonly string[]): string[] {
  const men =
    show === "lineup"
      ? (({ lines, bench: reserves }) => [...lines.flatMap((each) => each.players), ...reserves])(lineup(team, bench))
      : squadUnarranged(team).flatMap((each) => each.players);
  return men.map((rostered) => rostered.slot.fantraxId);
}

/** His lines in `order`; a man it lacks keeps the read's order at the foot. */
export function rosterOrder<T extends { fantraxId: string }>(lines: readonly T[], order: readonly string[]): T[] {
  const place = new Map(order.map((id, index) => [id, index]));
  const at = (line: T) => place.get(line.fantraxId) ?? order.length;
  return [...lines].sort((a, b) => at(a) - at(b));
}
