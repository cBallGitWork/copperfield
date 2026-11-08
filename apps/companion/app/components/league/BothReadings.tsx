import type { View } from "./ViewToggle";

const SPLIT_EVEN = "lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-10";
const SPLIT_WIDE = "lg:grid-cols-[minmax(0,4fr)_minmax(0,3fr)] lg:gap-2";

/** Two readings of one squad: the list left and the pitch right above `lg`, with air between so
 *  they read as two; below `lg` only the one `view` names. `listWide`, in one panel, gives the list the larger share
 *  and the pitch a CM gap, so the list's last column (the purple GW) needs no scroll at 1440. */
export default function BothReadings({
  view,
  list,
  pitch,
  listWide = false,
}: {
  view: View;
  listWide?: boolean;
  list: React.ReactNode;
  pitch: React.ReactNode;
}) {
  return (
    <div className={`grid grid-cols-[minmax(0,1fr)] gap-3 lg:items-start ${listWide ? SPLIT_WIDE : SPLIT_EVEN}`}>
      <div className={view === "list" ? "" : "hidden lg:block"}>{list}</div>
      <div className={view === "pitch" ? "" : "hidden lg:block"}>{pitch}</div>
    </div>
  );
}
