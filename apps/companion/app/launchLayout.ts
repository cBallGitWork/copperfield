// Championship Manager 99/00's loading screen (`cm9900/01.jpg`) as measurements, in points of a 390-wide phone: the
// iOS launch images (`launchScreen.tsx`) and the installed app's own launch frame (`shell/LaunchFrame`) both draw it.

/** The phone the layout is drawn for, in points; every length below is in its points and scales with the screen. */
export const DESIGN_WIDTH = 390;

export const LAUNCH = {
  gutter: 16,
  /** The air above the title and under the bar, as a share of the screen's height. */
  inset: 0.11,
  bevel: 2,
  shadow: { offset: 2, blur: 3, alpha: 0.45 },
  title: { height: 64, type: 24 },
  season: { gap: 12, height: 46, type: 19, span: 0.64 },
  /** The crest's width as a share of the screen's. */
  crest: 0.4,
  caption: { words: "LOADING DATABASE…", type: 13, track: 1.5, gap: 8 },
  /** `loaded` is how far the bar has run on the still image, as CM's is when its screen first shows. */
  bar: { height: 30, edge: 2, inset: 3, loaded: 0.62 },
} as const;
