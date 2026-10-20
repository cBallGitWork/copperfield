import { listed } from "../format";
import type { Deal, DealSide } from "../gazette/types";
import { toFplClubCode } from "../identity/clubCodes";
import type { InboxItem, Mention } from "./types";
import { fantraxInstant } from "./when";

// The league's business, as CM's Messages: who signed, who released, who traded. A headline is a bare fact; the
// body a letter from your assistant about your business, the commissioner about anyone else's. Never advice.

/** How many names any inbox headline carries: two fill one line on a 390 phone; the rest go in the body. */
export const NAMES_IN_HEADLINE = 2;

/** A man as a deal, a block or an offer lists him. */
interface ListedMan {
  playerName: string;
  club?: string | null;
  clubName?: string | null;
}

/** A man's name for a headline: `Brian Brobbey (SUN)`, where the feed gave a club, spelt as every other screen does. */
export function named(man: ListedMan): string {
  return man.club ? `${man.playerName} (${toFplClubCode(man.club)})` : man.playerName;
}

/** The same man in a letter: `Sunderland's Brian Brobbey`, else as headlined. */
export function spoken(man: ListedMan): string {
  return man.clubName ? `${man.clubName}'s ${man.playerName}` : named(man);
}

/** The league's business, as messages: one item per trade or claim, whose halves Fantrax files as rows sharing a
 *  `setId`. A trade, a signing (often paid for by a drop) or a bare release. */
export function dealNews(
  deals: readonly Deal[],
  /** A team's name, or null for an id the league no longer describes; injected, as this module may not hold the league. */
  teamName: (teamId: string) => string | null,
  /** The reader's own team, whose business is written to him as his; null when signed out. */
  mine: string | null,
): InboxItem[] {
  return deals.flatMap((deal) => {
    const gained = deal.inbound.map(named);
    const lost = deal.outbound.map(named);
    if (gained.length === 0 && lost.length === 0) return [];

    // Whose item it is: a trade has two sides, so it is the league's.
    const teams = teamsOf(deal);
    const teamId = teams.length === 1 ? teams[0] : null;
    const yours = teamId !== null && teamId === mine;
    const who = yours ? "You" : teamId === null ? null : teamName(teamId);

    const headline =
      deal.kind === "trade"
        ? tradeHeadline(deal, teamName)
        : gained.length > 0
          ? `${who ?? "A manager"} sign ${listed(gained.slice(0, NAMES_IN_HEADLINE))}`
          : `${who ?? "A manager"} release ${listed(lost.slice(0, NAMES_IN_HEADLINE))}`;

    const party = deal.kind === "trade" && sidesOf(deal).some((side) => side.teamId === mine);
    const body = dealBody(deal, yours ? null : (who ?? "A manager"), teamName, mine);

    return [
      {
        id: `deal:${deal.setId}`,
        category: "message" as const,
        at: deal.processedAt === null ? null : fantraxInstant(deal.processedAt),
        gameweek: null,
        headline,
        body,
        from: yours || party ? "Your assistant" : "The commissioner",
        about: null,
        teamId,
        // No box: business is about a transaction, not a man's fitness.
        mark: null,
        // Business is never red: your own deal you know of, and a rival's is news, not bad news.
        urgent: false,
        mentions: dealMentions(deal, body, teamName, mine),
      },
    ];
  });
}

/** The names a deal's body prints that its letter links: each man the feed gave an id, each team but the reader's. */
function dealMentions(
  deal: Deal,
  body: string,
  teamName: (teamId: string) => string | null,
  mine: string | null,
): Mention[] {
  const men = sidesOf(deal).flatMap((side) => (side.fantraxId ? [{ text: side.playerName, fantraxId: side.fantraxId }] : []));
  const teams = teamsOf(deal).flatMap((teamId) => {
    if (teamId === mine) return [];
    const text = teamName(teamId);
    return text === null ? [] : [{ text, teamId }];
  });
  return [...men, ...teams].filter((mention) => body.includes(mention.text));
}

/** The letter under the headline: what the headline did not say, as a person would say it.
 *  `who` is the rival who did it, or null when the business is the reader's own. */
function dealBody(
  deal: Deal,
  who: string | null,
  teamName: (teamId: string) => string | null,
  mine: string | null,
): string {
  const gained = deal.inbound.map(spoken);
  const lost = deal.outbound.map(spoken);
  const one = (names: readonly string[], single: string, plural: string) => (names.length === 1 ? single : plural);

  if (deal.kind === "trade") {
    const moves = deal.inbound.map((side) => {
      const to = side.teamId === mine ? "you" : side.teamId === null ? null : teamName(side.teamId);
      return `${spoken(side)} joins ${to ?? "a manager"}`;
    });
    if (moves.length === 0) return "";
    const party = sidesOf(deal).some((side) => side.teamId === mine);
    return `${party ? "Your trade has gone through" : "The trade has gone through"}: ${listed(moves)}.`;
  }

  if (gained.length === 0) {
    if (lost.length === 0) return "";
    return who === null
      ? `${listed(lost)} ${one(lost, "has", "have")} been released and ${one(lost, "goes", "go")} back into the pool.`
      : `${who} have released ${listed(lost)}. ${one(lost, "He's", "They're")} back in the pool.`;
  }

  if (who === null) {
    const room = lost.length === 0 ? "" : `, and ${listed(lost)} ${one(lost, "goes", "go")} back into the pool to make room`;
    if (deal.via === "waivers") return `Your waiver claim for ${listed(gained)} went through${room}.`;
    if (deal.via === "free agency") return `We've signed ${listed(gained)} as a free agent${room}.`;
    return `${listed(gained)} ${one(gained, "has", "have")} joined the squad${room}.`;
  }
  const room = lost.length === 0 ? "" : `, releasing ${listed(lost)} to make room`;
  if (deal.via === "waivers") return `${who} have claimed ${listed(gained)} off waivers${room}.`;
  if (deal.via === "free agency") return `${who} have signed ${listed(gained)} as a free agent${room}.`;
  return `${who} have signed ${listed(gained)}${room}.`;
}

/** Both managers, when a trade has two. Reads as the game would say it. */
function tradeHeadline(deal: Deal, teamName: (teamId: string) => string | null): string {
  const names = teamsOf(deal).map((id) => teamName(id) ?? "a manager");
  return names.length >= 2 ? `${names[0]} and ${names[1]} agree a trade` : "A trade is agreed";
}

/** Everyone a deal moves, gained then lost. */
function sidesOf(deal: Deal): DealSide[] {
  return [...deal.inbound, ...deal.outbound];
}

/** The teams a deal touches, each once, in the feed's order. */
function teamsOf(deal: Deal): string[] {
  return [...new Set(sidesOf(deal).map((side) => side.teamId))].filter((id) => id !== null);
}
