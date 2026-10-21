"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, type ReactNode, useState } from "react";
import { SELECT } from "./ButtonLink";
import { formHref } from "./formHref";
import { SUBMIT } from "@/app/desk";
import { ask } from "../../players/liveQuery";

// One URL parameter chosen from a list: every GET-form select in the app.
// It works with no script; with one, a change navigates at once, holds the page still and shows the pick while it loads.

export interface QueryOption {
  value: string;
  label: string;
}

export default function QuerySelect({
  name,
  label,
  value,
  options,
  action,
  clears,
  replace = false,
  fill = false,
  children,
}: {
  /** The query parameter it sets. */
  name: string;
  /** Its accessible name. */
  label: string;
  value: string;
  /** In the order offered; an option whose value is empty clears the parameter. */
  options: readonly QueryOption[];
  action: string;
  /** Builds on the Data board's query as last asked for, clearing these with the pick, rather than on the fields. */
  clears?: readonly string[];
  /** Whether the pick replaces the history entry rather than adding one. */
  replace?: boolean;
  /** Whether it takes the row's spare width rather than its options' own. */
  fill?: boolean;
  /** The rest of the query as hidden fields, rendered on the server (`Carried`). */
  children?: ReactNode;
}) {
  const router = useRouter();
  // The pick, held against the value it replaced so a fresh `value` from the server wins.
  const [asked, setAsked] = useState<{ from: string; to: string } | null>(null);
  const shown = asked !== null && asked.from === value ? asked.to : value;

  function pick(event: FormEvent<HTMLSelectElement>) {
    const select = event.currentTarget;
    if (select.form === null) return;
    const fields = formHref(action, new FormData(select.form));
    if (!follow(fields)) return;
    const href =
      clears === undefined
        ? fields
        : ask({ set: { ...Object.fromEntries(clears.map((key) => [key, ""])), [name]: select.value } });
    setAsked({ from: value, to: select.value });
    if (replace) router.replace(href, { scroll: false });
    else router.push(href, { scroll: false });
  }

  return (
    <form method="get" action={action} className={`flex gap-1.5 ${fill ? "min-w-0 flex-1 lg:flex-none" : "shrink-0"}`}>
      {children}
      <select name={name} aria-label={label} value={shown} onChange={pick} className={`${SELECT} w-full ${fill ? "min-w-0" : ""}`}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <noscript>
        <button type="submit" className={SUBMIT}>
          Show
        </button>
      </noscript>
    </form>
  );
}

/** Taps a link to `href` without following it: false when a `LeaveGuard` caught the tap to ask first. */
function follow(href: string): boolean {
  const link = document.createElement("a");
  link.href = href;
  let free = false;
  link.addEventListener("click", (event) => {
    event.preventDefault();
    free = true;
  });
  document.body.append(link);
  link.click();
  link.remove();
  return free;
}
