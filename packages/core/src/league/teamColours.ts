import { inkFor, luminance } from "../colour";

// A fantasy team's own colours, looked up in the app's table keyed on `teamId`, never the renamable name; an unlisted
// team takes `FALLBACK`. Spent only on the team's own title bar and each side of a head-to-head.

/** A team's plate and its trim: `ClubColours`' shape, declared apart because the layers may not import each other. */
export interface TeamColours {
  /** The plate the team's name is set on. */
  primary: string;
  /** Trim, for anything that needs a second colour off the same identity. */
  secondary: string;
}

/** The neutral for a team nobody has styled: the title bar's own chrome blue, not the clubs' grey. */
const FALLBACK: TeamColours = { primary: "#1d3f9e", secondary: "#FFFFFF" };

/** A team's colours in `table`, or the fallback for one it does not list. */
export function coloursOf(table: Readonly<Record<string, TeamColours>>, teamId: string): TeamColours {
  return table[teamId] ?? FALLBACK;
}

/** A colour too dark to stand on the desk's ground as a plate (`#111111` is 0.006). */
const NEAR_BLACK = 0.02;

/** The team's title-bar plate and whose blue its index spine runs in: a near-black team takes its second colour as
 *  the plate and the league's spine (the approved Squad picture, 8 Nov 2026), unless that is near-black too. */
export function teamPlate(colours: TeamColours): { background: string; ink: string; spine: "own" | "league" } {
  const dark = luminance(colours.primary) < NEAR_BLACK && luminance(colours.secondary) >= NEAR_BLACK;
  const background = dark ? colours.secondary : colours.primary;
  return { background, ink: inkFor(background), spine: dark ? "league" : "own" };
}
