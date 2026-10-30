import type { CSSProperties, ReactNode } from "react";
import type { ClubColours } from "@epl/core";
import { plateOn } from "@epl/core";
import { SCREEN_TALL } from "./FootFrame";
import PageHeader from "./PageHeader";
import Pinned from "./Pinned";
import { PINNED_TOP } from "@/app/desk";

// The frame a screen about a subject wears (a team, a club, a player): his colour on the bar, his tabs under it, locked
// with it to the top of a phone, and every table inside in his colours. `plateOn` picks the ink that survives the fill.

export default function PlateShell({
  colours,
  title,
  back,
  phoneBar = true,
  tabs,
  children,
}: {
  /** Already resolved: a manager's come from `teamColours`, a club's and a player's from `clubColours`. */
  colours: ClubColours;
  /** What goes on the bar, and nothing else. */
  title: string;
  /** Where the phone's back plate goes with no history; absent draws none. */
  back?: string;
  /** Whether a phone draws the bar: your own team's is the lit Team tab already, and its room goes to the pitch. */
  phoneBar?: boolean;
  tabs: ReactNode;
  children: ReactNode;
}) {
  const plate = plateOn(colours);
  // No back plate on a bar a phone never draws: a hidden one would still lock, and claim the top's room.
  const header = <PageHeader title={title} plate={plate} back={phoneBar ? back : undefined} />;

  return (
    // `--cm-index` re-points every table's index block at the subject's colour; `cm-index-scoped` stops
    // that block greying, which on a purple chip read 3.89:1 (`desk.css`).
    <div
      className={`cm-index-scoped flex flex-col gap-2 ${SCREEN_TALL}`}
      style={
        {
          "--cm-index": plate.background,
          "--cm-index-ink": plate.ink,
        } as CSSProperties
      }
    >
      {/* Off a phone's screen, never out of its outline: the bar holds the page's h1. */}
      {/* A bar with a way back locks the tabs inside its own pin; any other locks them alone, to the top of a phone. */}
      {phoneBar && back !== undefined ? (
        <PageHeader title={title} plate={plate} back={back} under={tabs} />
      ) : (
        <>
          {phoneBar ? header : <div className="max-lg:sr-only">{header}</div>}
          <Pinned edge="top" className={PINNED_TOP}>
            {tabs}
          </Pinned>
        </>
      )}
      {children}
    </div>
  );
}

