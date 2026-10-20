import { PAPER_TITLE } from "../gazette/editorial";
import type { PublishedStory } from "../gazette/story";
import { ordinal } from "../league/ordinal";
import type { InboxItem } from "./types";

// The paper in the reader's mail: a letter for each story whose own cargo names his team, never a match in its prose.

const PAPER = `The ${PAPER_TITLE}`;

/** What each letter needs from the app: whose mail it is, a team's short name, and a story's page. */
interface Reader {
  mine: string | null;
  name: (teamId: string) => string | null;
  href: (slug: string) => string;
}

/** One letter per story about the reader's team, one per tie where a story covers his two; none signed out. */
export function paperNews(stories: readonly PublishedStory[], reader: Reader): InboxItem[] {
  const { mine } = reader;
  if (mine === null) return [];
  return stories.flatMap((story) => lettersOf(story, mine, reader));
}

function lettersOf(story: PublishedStory, mine: string, reader: Reader): InboxItem[] {
  const page = reader.href(story.slug);
  const letter = (key: string, headline: string, body: string, href: string): InboxItem => ({
    id: `paper:${story.slug}${key}`,
    category: "message",
    at: story.filedAt,
    gameweek: story.gameweek,
    headline,
    body,
    from: story.byline,
    about: null,
    teamId: null,
    mark: null,
    urgent: false,
    link: { href, label: "Read the article" },
  });

  if (story.kind === "draft-report") {
    const draft = story.extras?.draft;
    return (draft?.matchups ?? []).flatMap((tie, at) => {
      const [own, other] = tie.home.teamId === mine ? [tie.home, tie.away] : tie.away.teamId === mine ? [tie.away, tie.home] : [];
      if (own === undefined || other === undefined) return [];
      const them = reader.name(other.teamId) ?? other.name;
      const headline =
        draft?.cutoff === "saturday"
          ? `${PAPER} on your tie with ${them} after Saturday`
          : own.score > other.score
            ? `${PAPER} on your win over ${them}`
            : own.score < other.score
              ? `${PAPER} on your defeat by ${them}`
              : `${PAPER} on your draw with ${them}`;
      // The match-up's own anchor on the report, `DraftReport`'s `d-N`.
      return [letter(`:d-${at + 1}`, headline, tie.standfirst, `${page}#d-${at + 1}`)];
    });
  }

  if (story.kind === "predictions") {
    return (story.ties ?? []).flatMap((tie) => {
      const other = tie.homeTeamId === mine ? tie.awayTeamId : tie.awayTeamId === mine ? tie.homeTeamId : null;
      if (other === null) return [];
      const them = reader.name(other);
      const headline =
        them === null
          ? `${PAPER} on your tie`
          : tie.callsTeamId === mine
            ? `${PAPER} backs you to beat ${them}`
            : tie.callsTeamId === other
              ? `${PAPER} backs ${them} to beat you`
              : `${PAPER} on your tie with ${them}`;
      const lede = tie.line.split(/\n\s*\n/u)[0]?.trim() ?? "";
      return [letter(`:${other}`, headline, lede === "" ? story.deck : lede, page)];
    });
  }

  if (story.kind === "trade") {
    // The side the lead man joined is the one the cargo names; the other side's letter is its deal in Mail.
    if (story.extras?.transfer?.teamId !== mine) return [];
    const headline = story.face === null ? `${PAPER} on your trade` : `${PAPER} on your signing of ${story.face.name}`;
    return [letter("", headline, story.deck, page)];
  }

  if (story.kind === "season-rankings") {
    const ranks = story.extras?.ranks ?? [];
    const at = ranks.findIndex((rank) => rank.teamId === mine);
    const rank = ranks[at];
    return rank === undefined ? [] : [letter("", `${PAPER} ranks you ${ordinal(at + 1)}`, rank.line, page)];
  }

  // The Bin XI is the men nobody holds, a Prem report the clubs, a presser its own letter: none names a team as data.
  return [];
}
