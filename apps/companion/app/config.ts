import { MAX_PAPER_STORIES, type PhotoCredit } from "@epl/core";

// The companion's own constants; anything a second consumer of core would need belongs in core's `config.ts`.

/** The signed session naming which team is holding the phone. */
export const TEAM_COOKIE = "team";

/** The manager's FPL entry id, unsigned: an entry id is public, and claiming another only shows his team. */
export const ENTRY_COOKIE = "fpl";

/** How long both cookies last, in seconds: one season. */
export const SEASON_IN_SECONDS = 60 * 60 * 24 * 300;

/** What a wrong sign-in code costs, in milliseconds: with no rate limiter, a slow no is a defence. */
export const WRONG_CODE_DELAY_MS = 700;

/** The paper's own name; the league's name is its publisher and prints above it. */
export const PAPER_NAME = "The Gazetta";

/** The name under the icon on a phone's home screen, where twelve characters is about all that fits. */
export const APP_SHORT_NAME = "Pro League";

/** Colours of tokens.css, and the paper's stock from paper.css, as sRGB, for what cannot read a CSS variable: the
 *  theme-colour meta, the web-app manifest, its icon and a shared story's card. Change with the stylesheets. */
export const TOKEN_SRGB = {
  bg: "#091227",
  league: "#c8102e",
  cream: "#f3eadd",
  paper: "#f6ddd2",
  // The desk's chrome, for the installed app's launch screen: the royal-blue plate and its bevel's two edges (desk.css
  // mixes the face 55% with white and with black), the accent, the ink, the muted ink, a panel's well and its edge.
  chrome: "#2f509c",
  chromeLit: "#9cafd5",
  chromeShade: "#081531",
  accent: "#f9d544",
  ink: "#f8f5ef",
  muted: "#b9b0a2",
  well: "#23201a",
  wellEdge: "#323439",
  // A gameweek's shared scores: the derived-reading cyan, the quiet ink and a panel's rule.
  info: "#3adaf2",
  faint: "#968e80",
  line: "#4b4741",
  // The index block's ramp at its two ends, as measured down `/league` (DESIGN §2).
  indexTop: "#3554a9",
  indexFoot: "#162e7c",
} as const;

/** How many deals the front page prints; the heading says the true total. */
export const DEALS_SHOWN = 6;

/** How many of the season's scorers the paper's chart prints: what a back page has room for and a reader scans. */
export const SCORERS_SHOWN = 10;

/** How many men each of the Live tab's gameweek leaders lists. */
export const LEADERS_SHOWN = 10;

/** How many gameweeks of xMins a player card prints, the screen's own first. */
export const XMINS_WEEKS = 5;

/** xMins under which the planner says a starter might not start, when a sub could play in his place (19 Oct 2026). */
export const START_DOUBT_MINUTES = 50;

/** How many results a form guide shows, oldest first: both tables' Form column and a match preview's. */
export const FORM_GAMES = 5;


/** How many filed stories run beside the lead, at the second rank. */
export const SHOULDER_STORIES = 2;

/** How many filed stories run as headlines under the lead, shoulders included: every one while the
 *  paper is verified, then 8. With no section pages, a story past the cap is linked from nowhere. */
export const HEADLINES_SHOWN = MAX_PAPER_STORIES;

/** A team to treat as the reader's own when nobody has signed in, for the test leagues, from the
 *  environment. Lent only when it is one of the served league's teams (`lentTeam`). */
export const DEMO_TEAM_ID = process.env.FANTRAX_DEMO_TEAM_ID || null;

/** What a page says when a provider will not answer; it never names which. */
export const UNAVAILABLE = "Not available right now";

/** How stale a rendered page may be, in seconds. Next reads `revalidate` statically, so every
 *  route segment repeats it as a literal; `scripts/revalidate.test.ts` holds them together. */
export const PAGE_REVALIDATE = 30;

/** How long the league's waiver schedule is held, in seconds: it moves only when the commissioner edits the setup. */
export const WAIVER_SCHEDULE_REVALIDATE = 60 * 60 * 6;

/** How near the next waiver run is before a banner says so, in hours (Craig, 19 Oct 2026: "when 18 hours left"). */
export const WAIVER_BANNER_HOURS = 18;

/** How many waiver runs a page carries, so a countdown left open past one moves on to the next without a reload. */
export const WAIVER_RUNS_AHEAD = 4;

/** How stale a printed article may be, in seconds: a story ships with the deploy that files it. */
export const ARTICLE_REVALIDATE = 300;

/** How stale Opta's commentary may be, in seconds: one request per fixture, and nothing live hangs on it. */
export const COMMENTARY_REVALIDATE = 300;

/** How stale the clubs' season stats may be, in seconds: twenty-one reads, and they move only when a match does. */
export const CLUB_SEASON_REVALIDATE = 300;

/** How stale the stats league's assist kinds may be, in seconds: a 1.3 MB read per gameweek, and
 *  the kinds only settle what FPL's own counts already pay. */
export const ASSIST_KINDS_REVALIDATE = 300;

/** How stale the stats league's period calendar may be, in seconds: read to know which periods have begun. */
export const STATS_PERIODS_REVALIDATE = 300;

/** How stale one day of the scoring league's counts may be, in seconds: three reads, two of them the whole pool. */
export const SCORING_DAY_REVALIDATE = 300;

/** How stale one footballer's FPL match history may be, in seconds: it moves only when he plays, and asking FPL
 *  for every player viewed every 30s helped it refuse Vercel (PLATFORM_NOTES, 8 Oct 2026). */
export const PLAYER_LOG_REVALIDATE = 60 * 60;

/** How stale a read that can no longer move may be, in seconds — a finished period's counts, a completed draft board,
 *  a man's past seasons: only a correction touches them, and a season's DefCon points ask for every period at once. */
export const FINAL_REVALIDATE = 60 * 60 * 24;

/** His completed seasons, which nothing moves until the summer: `FINAL_REVALIDATE` under `grid.ts`'s name. */
export const PAST_SEASONS_REVALIDATE = FINAL_REVALIDATE;

/** Lifetime of the reads a live score is drawn from (FPL's round, the PL's, Fantrax's live scoring), in seconds. Below
 *  `POLL.live` plus a fetch, or a stale-while-revalidate entry makes a lone reader see new scores every other poll. */
export const LIVE_REVALIDATE = 20;

/** Lifetime of FPL's bootstrap as the snapshot keeps it, in seconds: 1.3 MB of players, clubs and calendar that moves
 *  with news, not the match; on the live clock it was 39 MB in four minutes of three pages polling (11 Oct 2026). */
export const BASE_REVALIDATE = 300;

/** Lifetime of the season list's standby entry, in seconds, read only when the hour's is refused: the list is the
 *  hour's reading in a match window too, since the round in view rides on its own (19 Oct 2026). */
export const SEASON_FIXTURES_REVALIDATE = 300;

/** When FPL is read on the live clock: from `leadMinutes` before a London day's first kickoff to `tailMinutes` after
 *  its last (a match plus stoppages and the whistle's settling). Outside it nothing is in play (Craig, 11 Oct 2026). */
export const MATCH_WINDOW = { leadMinutes: 15, tailMinutes: 135 } as const;

/** Lifetime of every FPL read outside a match window, in seconds: one reading per hour, asked only when a page wants it;
 *  prices and news move overnight, and nothing here needs them sooner. */
export const QUIET_REVALIDATE = 60 * 60;

/** How long one FPL read rests after a failure before this process asks again, in ms: FPL's edge refreshes its live
 *  read about once a minute, and a stale entry otherwise asked a refusing FPL on every page view (11 Oct 2026). */
export const FPL_REST_MS = 60_000;

/** The longest that rest grows to, in ms: it doubles on each refusal in a row (60, 120, 240s), since FPL refuses
 *  Vercel for stretches of an hour and more and asking every minute only adds to them (19 Oct 2026). */
export const FPL_REST_MAX_MS = 240_000;

/** How long one reading of the branch's predicted elevens is held, in seconds: they move hourly at most, Thursday to
 *  Saturday's lock. */
export const XI_REVALIDATE = 600;

/** How long a failed read of the branch's elevens rests before this process asks again, in ms, so a cold key is not
 *  asked on every view. GitHub's, not FPL's: the two need not move together. */
export const XI_REST_MS = 60_000;

/** How often an open page asks for a fresh render, in seconds; `settle` is how soon it asks again after an open or a
 *  return in a match window, when the first answer was a stale read's (a deployment ask, a render and Fantrax's 0.5s read). */
export const POLL = {
  live: 30,
  idle: 300,
  settle: 4,
  // How long after a refresh the rail's tabs are fetched: past an FPL read, so they find it cached, not ask again.
  ahead: 5,
} as const;

/** Minutes before a gameweek's first kickoff that the Live tab opens, to build to it (Craig, 8 Oct 2026). */
export const LIVE_LEAD_MINUTES = 60;

/** Pull to refresh in the installed app (`shell/PullToRefresh`), in CSS px: the plate refreshes on letting go from
 *  `arm` (80px of finger; 144 was "hard", Craig, 11 Oct 2026), and a drag is a pull once 6px in and 1.5 times steeper
 *  than wide. */
export const PULL = {
  arm: 56,
  max: 88,
  damp: 0.7,
  intent: 6,
  steep: 1.5,
} as const;

/** The offline worker (`public/sw.js`). `on: false` is its kill switch: every phone that next opens the app
 *  unregisters it (PLATFORM_NOTES, "The offline worker"). */
export const OFFLINE_WORKER: { readonly on: boolean; readonly path: string } = { on: true, path: "/sw.js" };

/** How long the season's Fantrax code stays good, in seconds: it changes once a year. */
export const SEASON_CODE_LIFE = 60 * 60 * 6;

/** The photograph behind every desk screen (`PhotoGround`), or null for the gameweek's own portraits. */
export const DESK_GROUND: string | null = "/ground/crowd.jpg";

/** Its credit, printed on `/credits`: CC BY-SA 4.0 requires the author, the source and the terms.
 *  Replace it with the photograph. */
export const DESK_GROUND_CREDIT: PhotoCredit | null = {
  title: "Crowd at Anfield before the match 1",
  author: "Rodhullandemu",
  licence: "CC BY-SA 4.0",
  licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0",
  source: "https://commons.wikimedia.org/wiki/File:Crowd_at_Anfield_before_the_match_1.jpg",
};

/** The same picture at 16px wide, inline, so it paints before any request returns. Null
 *  whenever `DESK_GROUND` is. */
export const DESK_GROUND_BLUR: string | null =
  "data:image/jpeg;base64,/9j/2wBDABIMDRANCxIQDhAUExIVGywdGxgYGzYnKSAsQDlEQz85Pj1HUGZXR0thTT0+WXlaYWltcnNyRVV9hnxvhWZwcm7/2wBDARMUFBsXGzQdHTRuST5Jbm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm7/wAARCAALABADASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAAAgME/8QAIBAAAgICAQUBAAAAAAAAAAAAAQMCEQAEIRITM0GR4f/EABQBAQAAAAAAAAAAAAAAAAAAAAP/xAAaEQACAgMAAAAAAAAAAAAAAAAAAQIRISIx/9oADAMBAAIRAxEAPwAnag2LJLPux1fmWTsJcycmtgLPAMvuHY1EdvxQFkA0KzInURFTiFxuMuL5rCi6yhp7dP/Z";

/** A columnist who writes under his own name: how the paper bills him, and the photograph it runs
 *  beside him through the sheet's ink. Keyed by the story's `reporter`. */
export interface Columnist {
  billing: string;
  /** `focus` is where the faces sit, as an object-position, so a crop to the paper's frame keeps them. */
  photo: PhotoCredit & { src: string; alt: string; blur: string; focus: string };
  /** A square crop of the same photograph on him alone, for the banner over his column. */
  portrait: { src: string; blur: string };
  /** A 470x630 crop on him alone, cut from the original, for the card a shared link previews with. */
  card: string;
}

export const COLUMNISTS: Readonly<Record<string, Columnist>> = {
  "Mark Lawrenson": {
    billing: "Draft Expert",
    photo: {
      src: "/columnist/lawrenson-bbc.jpg",
      // His face sits in the top third of a 16:9 frame.
      focus: "50% 30%",
      alt: "Mark Lawrenson with a BBC Sport microphone",
      blur: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAYABgAAD/4QCARXhpZgAATU0AKgAAAAgABAEaAAUAAAABAAAAPgEbAAUAAAABAAAARgEoAAMAAAABAAIAAIdpAAQAAAABAAAATgAAAAAAAABgAAAAAQAAAGAAAAABAAOgAQADAAAAAQABAACgAgAEAAAAAQAAABCgAwAEAAAAAQAAAAkAAAAA/8AAEQgACQAQAwEiAAIRAQMRAf/EAB8AAAEFAQEBAQEBAAAAAAAAAAABAgMEBQYHCAkKC//EALUQAAIBAwMCBAMFBQQEAAABfQECAwAEEQUSITFBBhNRYQcicRQygZGhCCNCscEVUtHwJDNicoIJChYXGBkaJSYnKCkqNDU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6g4SFhoeIiYqSk5SVlpeYmZqio6Slpqeoqaqys7S1tre4ubrCw8TFxsfIycrS09TV1tfY2drh4uPk5ebn6Onq8fLz9PX29/j5+v/EAB8BAAMBAQEBAQEBAQEAAAAAAAABAgMEBQYHCAkKC//EALURAAIBAgQEAwQHBQQEAAECdwABAgMRBAUhMQYSQVEHYXETIjKBCBRCkaGxwQkjM1LwFWJy0QoWJDThJfEXGBkaJicoKSo1Njc4OTpDREVGR0hJSlNUVVZXWFlaY2RlZmdoaWpzdHV2d3h5eoKDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uLj5OXm5+jp6vLz9PX29/j5+v/bAEMABgYGBgYGCgYGCg4KCgoOEg4ODg4SFxISEhISFxwXFxcXFxccHBwcHBwcHCIiIiIiIicnJycnLCwsLCwsLCwsLP/bAEMBBwcHCwoLEwoKEy4fGh8uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLv/dAAQAAf/aAAwDAQACEQMRAD8A9y8TvHp+hXGzIlkRki2nad5HGD9eK1NJWO609FYHdGBG2TuOQB3rK8Xf6q2/66f1FaHhr/UXX/Xb/wBlFbOPucxN+h//2Q==",
      title: "Mark Lawrenson",
      author: "BBC Sport",
      licence: "© BBC",
      licenceUrl: "https://www.bbc.co.uk/usingthebbc/terms",
      source: "https://www.bbc.co.uk/sport",
    },
    portrait: {
      src: "/columnist/lawrenson-bbc-banner.jpg",
      blur: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAYABgAAD/4QCARXhpZgAATU0AKgAAAAgABAEaAAUAAAABAAAAPgEbAAUAAAABAAAARgEoAAMAAAABAAIAAIdpAAQAAAABAAAATgAAAAAAAABgAAAAAQAAAGAAAAABAAOgAQADAAAAAQABAACgAgAEAAAAAQAAAAqgAwAEAAAAAQAAAAoAAAAA/8AAEQgACgAKAwEiAAIRAQMRAf/EAB8AAAEFAQEBAQEBAAAAAAAAAAABAgMEBQYHCAkKC//EALUQAAIBAwMCBAMFBQQEAAABfQECAwAEEQUSITFBBhNRYQcicRQygZGhCCNCscEVUtHwJDNicoIJChYXGBkaJSYnKCkqNDU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6g4SFhoeIiYqSk5SVlpeYmZqio6Slpqeoqaqys7S1tre4ubrCw8TFxsfIycrS09TV1tfY2drh4uPk5ebn6Onq8fLz9PX29/j5+v/EAB8BAAMBAQEBAQEBAQEAAAAAAAABAgMEBQYHCAkKC//EALURAAIBAgQEAwQHBQQEAAECdwABAgMRBAUhMQYSQVEHYXETIjKBCBRCkaGxwQkjM1LwFWJy0QoWJDThJfEXGBkaJicoKSo1Njc4OTpDREVGR0hJSlNUVVZXWFlaY2RlZmdoaWpzdHV2d3h5eoKDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uLj5OXm5+jp6vLz9PX29/j5+v/bAEMABgYGBgYGCgYGCg4KCgoOEg4ODg4SFxISEhISFxwXFxcXFxccHBwcHBwcHCIiIiIiIicnJycnLCwsLCwsLCwsLP/bAEMBBwcHCwoLEwoKEy4fGh8uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLv/dAAQAAf/aAAwDAQACEQMRAD8A9X1uVo/GOnW4u/LRoyxjDkAbCScqDg7hxzmu/CwMMh1IPuK8auvm8aWG7n/RLs8+u6PmuoYnJ5rpjR31FKei0P/Z",
    },
    card: "/columnist/lawrenson-bbc-card.jpg",
  },
};

/** The columnist a story is by, or null for a staff writer. */
export function columnistOf(story: { reporter?: string }): Columnist | null {
  return story.reporter === undefined ? null : (COLUMNISTS[story.reporter] ?? null);
}
