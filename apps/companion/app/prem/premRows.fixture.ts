import type { Club, FootballPlayer } from "@epl/core";
import type { LeagueOpinion } from "./leagueOpinions";
import { clubCards } from "./premCards";

// The squad both Prem row tests draw: every unfit kind beside two fit men, our league listing three of them.

export const CLUB = { id: 1, code: 3, name: "Arsenal", shortName: "ARS" } as unknown as Club;
const season = new Proxy({ minutes: 900 } as Record<string, number>, { get: (t, k: string) => t[k] ?? 0 });
const man = (code: number, name: string, status: string, chanceOfPlaying: number | null, news: string) =>
  ({
    id: code,
    code,
    clubId: 1,
    name,
    fullName: name,
    firstName: "",
    secondName: name,
    status,
    news,
    chanceOfPlaying,
    season,
  }) as unknown as FootballPlayer;

// Saliba out at 0%, a major doubt, a ban, and two fit men.
export const MEN = [
  man(1, "Saliba", "i", 0, "Hamstring injury - Expected back 1 Nov"),
  man(2, "Saka", "d", 25, "Knock - 25% chance of playing"),
  man(3, "Rice", "s", 0, "Suspended until 25 Oct"),
  man(4, "Raya", "a", 100, ""),
  man(5, "Ødegaard", "a", null, ""),
];
export const UNFIT = 3;
export const byCode = new Map(MEN.map((player) => [player.code, player]));
const opinion = (ownerTeamId: string | null, owner: string | null, status: string): LeagueOpinion => ({
  fantraxId: "x",
  positions: ["D"],
  status,
  ownerTeamId,
  owner,
});
export const league = new Map<number, LeagueOpinion>([
  [1, opinion("t1", "Bannan", "T")],
  [2, opinion(null, null, "FA")],
  [3, opinion("t2", "Rival", "T")],
]);
export const minutes = new Map<number, number | null>([[1, 0], [2, 49], [3, 0], [4, 90], [5, 80]]);
// Cards for the three men our league lists; Raya and Ødegaard have none and print plain.
export const cards = clubCards(MEN, league, { club: CLUB, next: undefined, minutes: () => [] });
export const buttons = (html: string) => html.match(/<button type="button"/g)?.length ?? 0;

export const marks = (html: string) => html.match(/<svg role="img"/g)?.length ?? 0;
