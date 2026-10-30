import { statusChange } from "./boardChange";
import { Chip } from "./BoardControls";
import { isShown, type PlayersQuery } from "./query";
import { FREE, FREE_CHIP, STATUS, STATUS_CHIP } from "../ownerWords";

// Who he belongs to, as chips: the row's Free and Owned, each showing its men alone, and the sheet's FA and WW, the
// two halves of Free, for the reader who wants one of them (Craig, 16 Oct 2026).

/** The row's chips: Free for both halves of the bin, then each other status the pool carries (Owned for `T`). */
export function Statuses({
  query,
  counted,
  route,
  replace,
}: {
  query: PlayersQuery;
  /** How many of the pool are in each Fantrax status, for the chip's title. */
  counted: ReadonlyMap<string, number>;
  route: string;
  /** While the sheet is open, so Back leaves it. */
  replace: boolean;
}) {
  const bin = FREE.filter((code) => counted.has(code));
  const rest = [...counted.keys()].filter((code) => !FREE.includes(code)).sort();
  const chip = (codes: readonly string[], label: string, title: string) => (
    <Chip
      key={label}
      on={isShown(query, codes)}
      query={query}
      change={statusChange(codes, true)}
      route={route}
      replace={replace}
      title={title}
    >
      {label}
    </Chip>
  );
  return (
    <div role="group" aria-label="Status" className="flex gap-1.5">
      {bin.length === 0 ? null : chip(FREE, FREE_CHIP, bin.map((code) => titled(code, counted)).join(", "))}
      {rest.map((code) => chip([code], STATUS_CHIP[code] ?? code, titled(code, counted)))}
    </div>
  );
}

/** The sheet's FA and WW, each on or off on its own. */
export function LoneStatuses({
  query,
  counted,
  route,
}: {
  query: PlayersQuery;
  counted: ReadonlyMap<string, number>;
  route: string;
}) {
  return (
    <div role="group" aria-label="Free agents or waivers" className="flex flex-wrap gap-1.5">
      {FREE.map((code) => (
        <Chip
          key={code}
          on={isShown(query, [code])}
          query={query}
          change={statusChange([code])}
          route={route}
          replace
          title={titled(code, counted)}
        >
          {STATUS_CHIP[code] ?? code}
        </Chip>
      ))}
    </div>
  );
}

/** Whether the pool carries both halves of the bin, so the sheet has a half to offer that Free is not already. */
export function splitsBin(counted: ReadonlyMap<string, number>): boolean {
  return FREE.every((code) => counted.has(code));
}

/** How many halves of the bin the sheet has on alone: none while Free is pressed whole. */
export function loneCount(query: PlayersQuery): number {
  if (isShown(query, FREE)) return 0;
  return FREE.filter((code) => isShown(query, [code])).length;
}

function titled(code: string, counted: ReadonlyMap<string, number>): string {
  return `${STATUS[code] ?? code}: ${counted.get(code) ?? 0}`;
}
