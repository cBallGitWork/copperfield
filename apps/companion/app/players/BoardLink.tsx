"use client";

import { useTransition, type ComponentProps } from "react";
import { useRouter } from "next/navigation";
import Link from "../components/shell/Link";
import type { PlayersQuery } from "./query";
import { chosen, changeHref, statusOn, type BoardChange } from "./boardChange";
import { ask, useAsked } from "./liveQuery";

// A board control: its href is its `change` to the server's `query`, for no script; a tap applies the change to the
// query last asked for, so a tap made while another is loading adds to it. A toggle shows itself pressed at once.

export default function BoardLink({
  query,
  change,
  route,
  on,
  replace = false,
  children,
  ...link
}: Omit<ComponentProps<typeof Link>, "href" | "onNavigate" | "aria-pressed"> & {
  query: PlayersQuery;
  change: BoardChange;
  route?: string;
  /** Whether a toggle is on, as the server drew it. */
  on?: boolean;
}) {
  const router = useRouter();
  const [moving, start] = useTransition();
  const asked = useAsked();
  const pressed = on === undefined || asked === null ? on : pressedIn(asked, change, on);

  function go(event: { preventDefault: () => void }) {
    event.preventDefault();
    const href = ask(change);
    start(() => (replace ? router.replace(href, { scroll: false }) : router.push(href, { scroll: false })));
  }

  return (
    <Link
      {...link}
      href={changeHref(query, change, route)}
      replace={replace}
      scroll={false}
      aria-pressed={pressed}
      onNavigate={go}
    >
      {children}
      {/* `shell/Pending`'s mark, which a link that navigates for itself has to set. */}
      {moving ? <span hidden data-pending /> : null}
    </Link>
  );
}

/** Whether a toggle is on in the query last asked for; a control that is no toggle keeps the server's word. */
function pressedIn(asked: URLSearchParams, change: BoardChange, on: boolean): boolean {
  if (change.toggle) return chosen(asked.get(change.toggle[0])).includes(change.toggle[1]);
  if (change.status) return statusOn(asked.get("status"), asked.get("q"), change.status.codes);
  return on;
}
