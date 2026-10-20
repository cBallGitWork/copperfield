import type { Metadata, Viewport } from "next";
import { LEAGUE_NAME } from "@epl/core";
import { groundFaces, liveIn, offerLive } from "./football";
import { Suspense } from "react";
import { headers } from "next/headers";
import AutoRefresh from "./components/shell/AutoRefresh";
import CameFrom from "./components/shell/CameFrom";
import Glyph from "./components/shell/glyphs";
import LaunchFrame from "./components/shell/LaunchFrame";
import LiveFigure from "./components/shell/LiveFigure";
import LiveNow from "./components/shell/LiveNow";
import OfflineWorker from "./components/shell/OfflineWorker";
import PhotoGround from "./components/football/PhotoGround";
import PullToRefresh from "./components/shell/PullToRefresh";
import Rail from "./components/shell/Rail";
import ReplayStrip from "./components/shell/ReplayStrip";
import UnreadBadge from "./components/shell/UnreadBadge";
import { liveTie } from "./components/shell/liveTie";
import { aheadFor, sectionsFor } from "./components/shell/sections";
import { readInbox } from "./news/inbox";
import { readerTeamId } from "./squads";
import { orDegraded } from "./refusals";
import { venueOf } from "./venues";
import { deskFontVariables } from "./deskFonts";
import { startupImages } from "./launchScreens";
import { APP_SHORT_NAME, TOKEN_SRGB } from "./config";
import { TITLE_JOIN } from "./titles";
import "./globals.css";

export const metadata: Metadata = {
  // Each route names its screen (`titled`), so the route announcer has a change to say on every tab.
  title: { default: LEAGUE_NAME, template: `%s${TITLE_JOIN}${LEAGUE_NAME}` },
  description: `Live scores, head-to-head and the week's news for the ${LEAGUE_NAME}.`,
  // An iPhone names a home-screen icon after the page's title, which on `/more` is "More". Black-translucent lets
  // the installed app draw under the status bar, so the ground runs to the top; `.cm-statusbar` keeps the clock legible.
  // `startupImage` is what an iPhone draws while the installed app's first page loads, one per screen size.
  appleWebApp: { title: APP_SHORT_NAME, statusBarStyle: "black-translucent", startupImage: startupImages() },
  // Next prints only `mobile-web-app-capable`; an iPhone draws a `startupImage` only beside Apple's own name for it.
  other: { "apple-mobile-web-app-capable": "yes" },
};

export const viewport: Viewport = {
  // The front page overrides it, being the one surface that is not the desk.
  themeColor: TOKEN_SRGB.bg,
  // A phone held one-handed: no accidental double-tap zoom, and pinch-zoom still works.
  width: "device-width",
  initialScale: 1,
  // Without it iOS reports every safe-area inset as 0, and the rail sits on the home indicator.
  viewportFit: "cover",
};

/** The one poller, once it knows how far off live football is. A failed read gives null, the idle rate, so a failing
 *  provider is not polled hard. */
async function Poller({ matchday }: { matchday: boolean }) {
  const [live, asked] = await Promise.all([liveIn().catch(() => null), headers()]);
  const ahead = aheadFor(sectionsFor(matchday), asked.get("host"), process.env.VERCEL_URL);
  return <AutoRefresh liveIn={live} ahead={ahead} />;
}

/** The desk's ground, over the reader's own team's once signed in (Craig, 8 Oct 2026), Anfield's crowd before. The
 *  reader's team reads the league: an outage on a cold cache is Anfield, never the whole app down. */
async function Ground() {
  const [faces, reader] = await Promise.all([groundFaces(), orDegraded(readerTeamId(), () => null)]);
  return <PhotoGround faces={faces} home={reader === null ? null : venueOf(reader)} />;
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Started, not awaited: one read for the desk strip and the Live plate's score, each behind its own
  // boundary, so Fantrax never holds up every page.
  const tie = liveTie();
  // The inbox's ids for the Mail tab's badge, started like the tie; a failed read is no badge.
  const mail = readInbox()
    .then((inbox) => inbox.items.map((item) => item.id))
    .catch(() => []);
  // The only read the shell waits for: whether the rail offers Live. The poller and the ground stream in after.
  const matchday = await offerLive();

  return (
    // `LaunchFrame`'s script stamps `data-launch` on <html> before hydration, in the installed app only.
    <html lang="en-GB" className={deskFontVariables} suppressHydrationWarning>
      {/* A row: the rail, then the content. `min-w-0` on the content column stops its `truncate` and
          `overflow-x-auto` children pushing it wider than the screen. */}
      <body className="flex min-h-dvh antialiased">
        {/* CM's loading screen over every full load of the installed app, first in the body so it is the first paint. */}
        <LaunchFrame />
        <div aria-hidden className="cm-statusbar" />
        {/* CM's darkened match photograph under every desk screen. `sweep` cannot see it, so nothing prints
            on the bare ground, and `tools/ui/groundfit.mjs` checks that. */}
        <Suspense fallback={null}>
          <Ground />
        </Suspense>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-[60] focus:bg-raised focus:px-3 focus:py-2 focus:text-sm"
        >
          Skip to content
        </a>
        <Rail
          matchday={matchday}
          live={
            <Suspense fallback={<Glyph name="live" />}>
              <LiveFigure tie={tie} />
            </Suspense>
          }
          mail={
            <Suspense fallback={null}>
              <UnreadBadge inbox={mail} />
            </Suspense>
          }
        />
        <div className="flex min-w-0 flex-1 flex-col">
          {/* One poller for the whole app. The server says how far off live football is and the client counts
              down (`cadence.ts`). Live means the round is under way, never only that a ball is in the air. */}
          <Suspense fallback={null}>
            <Poller matchday={matchday} />
          </Suspense>
          {/* The same fresh render on demand, by pulling down from the top, in the home-screen app only. */}
          <PullToRefresh />
          <OfflineWorker />
          <CameFrom />
          <ReplayStrip />
          {/* In the content column, so the strip does not start under the rail; suspended so a slow
              league read holds up no page, and drawn as nothing while it waits. */}
          <Suspense fallback={null}>
            <LiveNow tie={tie} />
          </Suspense>
          {/* The bottom padding is a token because the front page runs its stock out through it. */}
          <main
            id="main"
            className="mx-auto w-full max-w-[var(--page-frame)] px-[var(--page-gutter)] pb-[var(--page-foot)] pt-[var(--page-top)]"
          >
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
