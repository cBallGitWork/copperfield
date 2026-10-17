import sharp from "sharp";
import { cmLoader } from "../../launchScreen";
import { LAUNCH_SCREENS, launchPixels, launchScreenFor } from "../../launchScreens";

// The installed iPhone app's launch screen at `/launch/{w}x{h}`, drawn at build: Championship Manager's loading
// screen on the desk's navy (Craig, 12 Oct 2026: "go for a champ manager themed loader").

/** A few flat colours, the bar's ramp and the type's edges: a 64-colour palette keeps a screen small. */
const PALETTE = { palette: true, colours: 64, compressionLevel: 9 } as const;

export const dynamicParams = false;

export function generateStaticParams() {
  return LAUNCH_SCREENS.map((screen) => ({ screen: launchPixels(screen).id }));
}

export async function GET(_request: Request, { params }: { params: Promise<{ screen: string }> }) {
  const screen = launchScreenFor((await params).screen);
  if (screen === null) return new Response(null, { status: 404 });
  const size = launchPixels(screen);
  const drawn = await (await cmLoader(size)).arrayBuffer();
  const png = await sharp(Buffer.from(drawn)).png(PALETTE).toBuffer();
  return new Response(new Uint8Array(png), { headers: { "Content-Type": "image/png" } });
}
