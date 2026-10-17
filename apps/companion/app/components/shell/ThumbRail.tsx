"use client";

import Link from "@/app/components/shell/Link";
import type { ReactNode } from "react";
import Glyph from "./glyphs";
import { barSections, tabOwns, type Section } from "./sections";

// The phone's navigation: CM's rail laid along the foot, a glyph over each word, one tab per section.

const TAB = "relative grid min-h-14 min-w-0 grid-rows-[1.5rem_auto] content-center justify-items-center gap-y-1 px-0.5";

export default function ThumbRail({
  sections,
  pathname,
  live,
  mail,
}: {
  /** Already filtered for the gameweek, so Live is absent between gameweeks. */
  sections: readonly Section[];
  pathname: string;
  /** Your live score, or the match clock, for the Live tab's glyph slot. */
  live: ReactNode;
  /** The unread badge, for the Read tab's envelope. */
  mail: ReactNode;
}) {
  return (
    <nav
      aria-label="Sections"
      className="cm-thumbrail fixed inset-x-0 bottom-0 z-50 grid auto-cols-fr grid-flow-col pb-[var(--safe-bottom)] pl-[var(--safe-left)] pr-[var(--safe-right)] lg:hidden"
    >
      {barSections(sections).map((section) => (
        <Link
          key={section.href}
          href={section.href}
          aria-current={tabOwns(sections, section, pathname) ? "page" : undefined}
          className={TAB}
        >
          <Face
            label={section.label}
            figure={section.onlyDuringGameweek ? live : section.glyph && <Glyph name={section.glyph} />}
            badge={section.glyph === "mail" ? mail : null}
            dot={section.onlyDuringGameweek}
          />
        </Link>
      ))}
    </nav>
  );
}

/** A tab's face: a 24px figure over a 12px word. `navfit` reads the word as the last span. */
function Face({
  label,
  figure,
  badge = null,
  dot = false,
}: {
  label: string;
  figure: ReactNode;
  badge?: ReactNode;
  dot?: boolean;
}) {
  return (
    <>
      <span className="relative flex h-6 items-center">
        {figure}
        {badge}
      </span>
      <span className="flex max-w-full items-center truncate text-xs font-semibold leading-4">
        {dot ? <span aria-hidden className="mr-1 size-[7px] shrink-0 rounded-full bg-live" /> : null}
        {label}
      </span>
    </>
  );
}
