import type { ReactNode } from "react";
import Link from "@/app/components/shell/Link";
import { SMALL_CAPS } from "@/app/desk";

// A plate naming where you are in a run (a gameweek, a match day), with CM's arrows either side under a thumb.
// No ink colour or font family here: unlayered `.cm-bevel` sets both, and `--color-ink` on the plate would be 2.27:1.

/** One neighbour: where its arrow goes, and the name a screen reader gives it. */
export interface Step {
  href: string;
  label: string;
}

export default function StepHead({
  label,
  title,
  previous,
  next,
  heading: Heading = "h2",
  children,
}: {
  /** What the arrows step through, for the nav's name: "Gameweeks", "Match days". */
  label: string;
  title: string;
  /** Null at either end of the run. */
  previous: Step | null;
  next: Step | null;
  /** `h3` under a section's own head. */
  heading?: "h2" | "h3";
  /** What the screen adds on the plate, such as the schedule's deadline. */
  children?: ReactNode;
}) {
  return (
    <nav aria-label={label} className="flex gap-0.5">
      <Arrow step={previous} back />
      <Heading className={`cm-bevel flex h-11 min-w-0 flex-1 items-center justify-between gap-3 px-1.5 lg:h-9 ${SMALL_CAPS}`}>
        <span className="shrink-0">{title}</span>
        {children}
      </Heading>
      <Arrow step={next} />
    </nav>
  );
}

/** CM's small filled triangle on a plate, or an inert outline at either end so the head keeps its place. */
function Arrow({ step, back = false }: { step: Step | null; back?: boolean }) {
  const box = "flex size-11 shrink-0 items-center justify-center lg:size-9";
  const mark = (
    <span
      aria-hidden
      className={`size-0 border-y-[6px] border-y-transparent ${back ? "border-r-[8px] border-r-current" : "border-l-[8px] border-l-current"}`}
    />
  );
  if (step === null) return <span className={`${box} border border-line text-faint opacity-40`}>{mark}</span>;

  return (
    // Replaces this page in history, as a tab does, so Back leaves the section rather than stepping back through the run.
    <Link href={step.href} replace aria-label={step.label} className={`cm-bevel ${box} hover:brightness-110`}>
      {mark}
    </Link>
  );
}
