import type { ReactNode } from "react";
import StepHead from "./StepHead";

// The strip heading the gameweek on screen, arrows either side; the gameweek is printed here so no caller can leave it out.

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
  const to = (week: number | null) => (week === null ? null : { href: step.href(week), label: `Gameweek ${week}` });
  return (
    <StepHead label="Gameweeks" title={`Gameweek ${gameweek}`} previous={to(step.previous)} next={to(step.next)}>
      {children}
    </StepHead>
  );
}
