"use client";

import Link from "@/app/components/shell/Link";

// CM's grey foot bar (cm9900/24.jpg, 10.jpg): Back, and the next screen, on the desk only; a phone has its thumb rail.

const PLATE = "cm-bevel flex min-h-12 items-center justify-center gap-2 font-chrome text-lg font-bold";

/** `◄ Back` through the browser's history, and `next` when there is a next screen. */
export default function FootBar({ next }: { next: { href: string; label: string } | null }) {
  return (
    <nav aria-label="Back and next" className="mt-2 hidden grid-cols-2 gap-1 lg:grid">
      <button type="button" onClick={() => history.back()} className={PLATE}>
        <span aria-hidden>◄</span> Back
      </button>
      {next === null ? (
        <span aria-hidden className={PLATE} />
      ) : (
        <Link href={next.href} className={PLATE}>
          {next.label} <span aria-hidden>►</span>
        </Link>
      )}
    </nav>
  );
}
