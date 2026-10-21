"use client";

import { useSearchParams } from "next/navigation";
import TabStrip, { type Tab } from "../components/shell/TabStrip";
import { carriedHref } from "./carry";

// Data's strip, each plate carrying the filters the view it opens reads, from the address bar on screen (`carry.ts`).

export default function ViewStrip<K extends string>({ tabs, current }: { tabs: readonly (Tab & { key: K })[]; current: K }) {
  const search = useSearchParams();
  const carried = tabs.map((tab) => ({ ...tab, href: carriedHref(tab.href, current, tab.key, search) }));
  return <TabStrip label="Data views" tabs={carried} current={current} labels="word" />;
}
