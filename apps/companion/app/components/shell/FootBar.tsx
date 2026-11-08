"use client";

import Link from "@/app/components/shell/Link";

// CM's grey foot bar (cm9900/24.jpg, 10.jpg): back and next, on the desk only; a phone has its thumb rail.

const PLATE = "cm-bevel flex min-h-12 items-center justify-center gap-2 font-chrome text-lg font-bold";

type Step = { href: string; label: string };

/** A step as a plate, or the plate drawn empty where there is none (CM greys its Next). */
function StepPlate({ step, forward }: { step: Step | null; forward: boolean }) {
  if (step === null) return <span aria-hidden className={PLATE} />;
  return (
    <Link href={step.href} className={PLATE}>
      {forward ? null : <span aria-hidden>◄</span>} {step.label} {forward ? <span aria-hidden>►</span> : null}
    </Link>
  );
}

/** `◄ Back` through the browser's history, or `previous` where the screen has one of its own; and `next`. */
export default function FootBar({ previous, next }: { previous?: Step | null; next: Step | null }) {
  return (
    <nav aria-label="Back and next" className="mt-2 hidden grid-cols-2 gap-1 lg:grid">
      {previous === undefined ? (
        <button type="button" onClick={() => history.back()} className={PLATE}>
          <span aria-hidden>◄</span> Back
        </button>
      ) : (
        <StepPlate step={previous} forward={false} />
      )}
      <StepPlate step={next} forward />
    </nav>
  );
}
