import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "@/app/components/shell/Link";
import type { ReactNode } from "react";
import { FANTRAX_HOME_PATH } from "@epl/core";
import { feedAddresses } from "../calendar.ics/locks";
import { fantraxPage } from "../fantraxPages";
import { BUTTON } from "../components/shell/ButtonLink";
import OutLink from "../components/shell/OutLink";
import ReadViews from "../components/shell/ReadViews";
import { CREDITS, SCORING, SECTIONS, overflowSections } from "../components/shell/sections";
import { LABEL, PANEL, PANEL_FLUSH, ROW_HOVER } from "@/app/desk";
import { SQUAD } from "../squad/routes";
import { leagueInfo } from "../round";
import { readerTeamId } from "../squads";
import { MORE_TITLE, SCORING_TITLE } from "../titles";

// The page at the end of Read's strip: the sections with no tab of their own, the squads, the scoring, the credits, Fantrax and how to install.

export const metadata: Metadata = { title: MORE_TITLE };

/** Adding the app to a home screen, in each browser's own words for its buttons. */
const INSTALL: { device: string; steps: ReactNode[] }[] = [
  {
    device: "iPhone, in Safari",
    steps: [
      <>Tap <b>Share</b>, or <b>⋯</b> then <b>Share</b></>,
      <>Tap <b>Add to Home Screen</b></>,
      <>Tap <b>Add</b></>,
    ],
  },
  {
    device: "Android, in Chrome",
    steps: [
      <>Tap <b>⋮</b> at the top right</>,
      <>Tap <b>Add to Home screen</b> or <b>Install app</b></>,
      <>Tap <b>Install</b></>,
    ],
  },
];

export default async function MorePage() {
  const [team, feed] = await Promise.all([readerTeamName(), lockFeed()]);
  return (
    <>
      <ReadViews current="more" />
      {/* No bar under Read's strip, as Mail: the strip names the view. */}
      <h1 className="sr-only">{MORE_TITLE}</h1>
      <nav aria-label={MORE_TITLE} className={PANEL_FLUSH}>
        {overflowSections(SECTIONS).map((section) => (
          <Row key={section.href} href={section.href}>
            {section.fullLabel ?? section.label}
          </Row>
        ))}
        <Row href={SQUAD} aside={team ?? "Sign in"}>
          Squads
        </Row>
        <Row href={SCORING}>{SCORING_TITLE}</Row>
        <Row href={CREDITS}>Credits</Row>
      </nav>
      {/* The two ways out, as button plates (ButtonLink is the one way out of a page). */}
      <div className={PANEL}>
        <OutLink href={fantraxPage(FANTRAX_HOME_PATH)} className={`${BUTTON} lg:self-start`}>
          Open the league on Fantrax
        </OutLink>
        {feed === null ? null : (
          <>
            <a href={feed.webcal} className={`${BUTTON} lg:self-start`}>
              Add the lock times to your calendar
            </a>
            <a href={feed.https} className="flex min-h-11 items-center px-1 text-sm text-muted underline lg:min-h-9">
              Or subscribe by address
            </a>
          </>
        )}
      </div>
      {/* Gone once installed: the app then opens in its own window. */}
      <section
        aria-labelledby="more-install"
        className={`${PANEL_FLUSH} gap-3 px-3.5 pb-3 pt-2 [@media(display-mode:standalone)]:hidden`}
      >
        <h2 id="more-install" className={LABEL}>
          Install on your phone
        </h2>
        {INSTALL.map(({ device, steps }) => (
          <div key={device}>
            <h3 className="font-chrome text-sm font-bold">{device}</h3>
            <ol className="list-decimal pl-5 text-sm">
              {steps.map((step, index) => (
                <li key={index}>{step}</li>
              ))}
            </ol>
          </div>
        ))}
      </section>
    </>
  );
}

/** One row: the place, what it holds for you, and CM's small filled triangle for "this opens something". */
function Row({ href, aside, children }: { href: string; aside?: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className={`flex min-h-13 items-center gap-3 pl-3.5 pr-3 font-chrome last:border-b-0 ${ROW_HOVER}`}
    >
      <span className="min-w-0 flex-1 truncate text-lg font-semibold">{children}</span>
      {aside === undefined ? null : <span className="shrink-0 text-sm text-muted">{aside}</span>}
      <span
        aria-hidden
        className="size-0 shrink-0 border-y-[5px] border-l-[7px] border-y-transparent border-l-muted"
      />
    </Link>
  );
}

/** The signed-in reader's team name, or null for a reader with no code: one cached league read, no rosters. */
async function readerTeamName(): Promise<string | null> {
  const [info, mine] = await Promise.all([leagueInfo(), readerTeamId()]);
  return info?.teams.find((team) => team.teamId === mine)?.name ?? null;
}

/** The lock calendar's addresses on the host this page was asked for; null with no host to name. */
async function lockFeed(): Promise<{ webcal: string; https: string } | null> {
  const asked = await headers();
  const host = asked.get("x-forwarded-host") ?? asked.get("host");
  return host === null ? null : feedAddresses(`${asked.get("x-forwarded-proto") ?? "https"}://${host}`);
}
