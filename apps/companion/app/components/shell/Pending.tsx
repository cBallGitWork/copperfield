"use client";

import { useLinkStatus } from "next/link";
import "./pending.css";

// A tapped link whose page is still on its way. No route draws a loading frame, so the old page holds until the new
// one lands; this marks the tap, desk.css presses the plate it sits in and pending.css shades a list row. It must sit
// inside a `<Link>`, and `shell/Link` puts one in every link.

export default function Pending() {
  const { pending } = useLinkStatus();
  return pending ? <span hidden data-pending /> : null;
}
