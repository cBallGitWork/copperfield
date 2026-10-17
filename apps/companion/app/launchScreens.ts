// The installed iPhone app's launch screens: iOS draws one only when a `apple-touch-startup-image` link's media
// query names the phone's exact screen, so every current iPhone screen is listed, portrait, in CSS points.

export interface LaunchScreen {
  width: number;
  height: number;
  ratio: 2 | 3;
}

/** Every iPhone screen since the X and the SE's, as the phones report them; a new size is one row here. */
export const LAUNCH_SCREENS: readonly LaunchScreen[] = [
  { width: 440, height: 956, ratio: 3 }, // 16 Pro Max, 17 Pro Max
  { width: 430, height: 932, ratio: 3 }, // 14 Pro Max, 15 Plus and Pro Max, 16 Plus
  { width: 428, height: 926, ratio: 3 }, // 12 and 13 Pro Max, 14 Plus
  { width: 420, height: 912, ratio: 3 }, // Air
  { width: 414, height: 896, ratio: 3 }, // XS Max, 11 Pro Max
  { width: 414, height: 896, ratio: 2 }, // XR, 11
  { width: 402, height: 874, ratio: 3 }, // 16 Pro, 17, 17 Pro
  { width: 393, height: 852, ratio: 3 }, // 14 Pro, 15, 15 Pro, 16
  { width: 390, height: 844, ratio: 3 }, // 12, 13, 14, 16e
  { width: 375, height: 812, ratio: 3 }, // X, XS, 11 Pro, 12 and 13 mini
  { width: 375, height: 667, ratio: 2 }, // SE, 8
];

/** The image's own size in device pixels, which is also its address: `1179x2556`. */
export function launchPixels({ width, height, ratio }: LaunchScreen): { width: number; height: number; id: string } {
  const pixels = { width: width * ratio, height: height * ratio };
  return { ...pixels, id: `${pixels.width}x${pixels.height}` };
}

/** The screen an address names, or null for one no iPhone has. */
export function launchScreenFor(id: string): LaunchScreen | null {
  return LAUNCH_SCREENS.find((screen) => launchPixels(screen).id === id) ?? null;
}

/** The metadata's `startupImage` list: one link per screen, matched by points, ratio and portrait. */
export function startupImages(): { url: string; media: string }[] {
  return LAUNCH_SCREENS.map((screen) => ({
    url: `/launch/${launchPixels(screen).id}`,
    media:
      `(device-width: ${screen.width}px) and (device-height: ${screen.height}px) and ` +
      `(-webkit-device-pixel-ratio: ${screen.ratio}) and (orientation: portrait)`,
  }));
}
