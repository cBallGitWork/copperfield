import type { Club, FootballPlayer, MinutesRun, Opposition, PlayerMatchStats, SquadPlayerDetail } from "@epl/core";
import type { LeagueOpinion } from "./leagueOpinions";
import { backToFront } from "../positions";

// A Premier League man as the app's one player card takes him, so a club or a match opens the card every squad does.

/** One man's card. One our league does not list has no Fantrax profile and so no card: the caller skips him. */
export function premCard(
  player: FootballPlayer,
  opinion: LeagueOpinion,
  { club, opposition, minutes, stats = [] }: {
    club: Club | undefined;
    opposition: Opposition[] | undefined;
    minutes: MinutesRun;
    stats?: PlayerMatchStats[];
  },
): SquadPlayerDetail {
  return {
    rostered: {
      // Our league's letters in pitch order, `M/F` for two, as the tile prints them; the card only prints it.
      slot: { fantraxId: opinion.fantraxId, position: backToFront(opinion.positions).join("/") || null, status: "" },
      player,
      stats,
    },
    club,
    opposition,
    points: undefined,
    minutes: minutes(player.code),
  };
}

/** Every listed man at one club by FPL code, against its next match and with the xMins run from that week. */
export function clubCards(
  players: readonly FootballPlayer[],
  league: ReadonlyMap<number, LeagueOpinion>,
  context: { club: Club; next: Opposition | undefined; minutes: MinutesRun },
): Map<number, SquadPlayerDetail> {
  const cards = new Map<number, SquadPlayerDetail>();
  const opposition = context.next === undefined ? undefined : [context.next];
  for (const player of players) {
    const opinion = league.get(player.code);
    if (opinion !== undefined) cards.set(player.code, premCard(player, opinion, { club: context.club, opposition, minutes: context.minutes }));
  }
  return cards;
}
