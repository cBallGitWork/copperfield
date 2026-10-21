import { Holder } from "../players/BoardRow";
import type { Holders } from "./holders";

/** The Data boards' holder tag after a Prem row's name; nothing for a man our league does not list. */
export default function LeagueHolder({ code, holders, className }: { code: number | null; holders: Holders; className: string }) {
  const held = code === null ? undefined : holders.league.get(code);
  return held === undefined ? null : (
    <Holder held={held} teamNames={holders.teamNames} reader={holders.reader} className={className} />
  );
}
