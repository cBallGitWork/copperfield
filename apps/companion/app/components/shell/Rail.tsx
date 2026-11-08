"use client";

import Link from "@/app/components/shell/Link";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import ThumbRail from "./ThumbRail";
import { CREDITS, sectionOwns, sectionsFor } from "./sections";

// Championship Manager's rail: down the side of a desk, and laid along the foot of a phone (`ThumbRail`).
// It decides the section list once, from the gameweek; client only because `usePathname` says where you are.

export default function Rail({
  matchday,
  head,
  live,
  mail,
}: {
  matchday: boolean;
  /** CM's sidebar head over the sections (`RailHead`): a server node, since it reads the league and the session. */
  head: ReactNode;
  /** Your live score or the match clock, for the Live tab: a server node, since the number comes off Fantrax. */
  live: ReactNode;
  /** The unread badge for the Read tab, which the layout hands its inbox read. */
  mail: ReactNode;
}) {
  const pathname = usePathname();
  // The paper wears the rail too; it sits beside `--page-frame`, not inside it, so the front page's `@container` holds.

  const sections = sectionsFor(matchday);

  return (
    <>
      <ThumbRail sections={sections} pathname={pathname} live={live} mail={mail} />

      {/* The rail, from `lg`, on its own opaque ground: the fixed `PhotoGround` would run up behind the labels. */}
      <nav
        aria-label="Sections"
        className="sticky top-0 z-50 hidden h-dvh w-[8.125rem] shrink-0 flex-col gap-1 self-start overflow-y-auto border-r-2 border-black bg-bg p-1 pl-[calc(var(--safe-left)+0.25rem)] lg:flex"
      >
        {head}
        <ul className="flex flex-col gap-1">
          {sections.map((section) => {
            const here = sectionOwns(section, pathname);
            return (
              <li key={section.href} className="contents">
                <Link
                  href={section.href}
                  aria-current={here ? "page" : undefined}
                  // No letterspacing: the rail's labels have no room to spare.
                  // A tapped section is marked as the one you are on while its page is on the way (`Pending`, in every `Link`).
                  className="cm-rail-plate flex min-h-12 items-center justify-center"
                >
                  {section.label}
                </Link>
              </li>
            );
          })}
        </ul>
        {/* An attribution licence needs the credits page reachable; `mt-auto` floors it below the sections. */}
        <Link
          href={CREDITS}
          className="mt-auto px-1 py-3 text-center font-chrome text-3xs uppercase text-faint hover:text-ink"
        >
          Credits
        </Link>
      </nav>
    </>
  );
}
