import { FANTRAX_LEAGUE_ID, type PlayerStory, fetchPoolNews, mapPoolNews } from "@epl/core";
import { leagueRead } from "./leagueCache";

// The pool's last day or so of news in one cached read, where a story per man would be a request per man. A refusal
// costs the card its news and nothing else.

export const readPoolNews = leagueRead("pool-news", () => fetchPoolNews(FANTRAX_LEAGUE_ID), mapPoolNews,
  (): Record<string, PlayerStory> => ({}));

/** The stories for the men on one screen, so the browser is not handed the whole pool's. */
export function newsFor(
  stories: Record<string, PlayerStory>,
  fantraxIds: readonly string[],
): Record<string, PlayerStory> {
  const mine: Record<string, PlayerStory> = {};
  for (const id of fantraxIds) {
    const story = stories[id];
    if (story !== undefined) mine[id] = story;
  }
  return mine;
}
