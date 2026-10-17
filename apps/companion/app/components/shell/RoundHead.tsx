import type { ReactNode } from "react";
import Link from "@/app/components/shell/Link";
import { SMALL_CAPS } from "@/app/desk";

// The strip heading the gameweek on screen, arrows either side; the gameweek is printed here so no caller can leave it out.
// No ink colour or font family here: unlayered `.cm-bevel` sets both, and `--color-ink` on the plate would be 2.27:1.

/** The weeks either side, flanking the head under a thumb. */
export interface RoundStep {
  previous: number | null;
  next: number | null;
  href: (gameweek: number) => string;
}

export default function RoundHead({
  gameweek,
  step,
  children,
}: {
  gameweek: number;
  step: RoundStep;
  /** What the screen adds about the gameweek, such as the schedule's deadline. */
  children?: ReactNode;
}) {
  return (
    <nav aria-label="Gameweeks" className="flex gap-0.5">
      <Arrow gameweek={step.previous} href={step.href} back />
      <h2 className={`cm-bevel flex h-11 min-w-0 flex-1 items-center justify-between gap-3 px-1.5 lg:h-9 ${SMALL_CAPS}`}>
        <span className="shrink-0">Gameweek {gameweek}</span>
        {children}
      </h2>
      <Arrow gameweek={step.next} href={step.href} />
    </nav>
  );
}

/** CM's small filled triangle on a plate, or an inert outline at either end of the season so the head keeps its place. */
function Arrow({ gameweek, href, back = false }: { gameweek: number | null; href: RoundStep["href"]; back?: boolean }) {
  const box = "flex size-11 shrink-0 items-center justify-center lg:size-9";
  const mark = (
    <span
      aria-hidden
      className={`size-0 border-y-[6px] border-y-transparent ${back ? "border-r-[8px] border-r-current" : "border-l-[8px] border-l-current"}`}
    />
  );
  if (gameweek === null) return <span className={`${box} border border-line text-faint opacity-40`}>{mark}</span>;

  return (
    // Replaces this page in history, as a tab does, so Back leaves the section rather than stepping back through weeks.
    <Link href={href(gameweek)} replace aria-label={`Gameweek ${gameweek}`} className={`cm-bevel ${box} hover:brightness-110`}>
      {mark}
    </Link>
  );
}
