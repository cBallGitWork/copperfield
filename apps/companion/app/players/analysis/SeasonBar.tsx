import type { PastSeason } from "@epl/core";
import QuerySelect from "../../components/shell/QuerySelect";
import ButtonLink from "../../components/shell/ButtonLink";
import { seasonValue, type CompareField } from "../routes";
import { Carried } from "./PickBar";
import { SEASON_PARAM } from "./season";
import type { CompareRoute, Opening } from "./compareRoute";

// Each side's season (Craig, 21 Oct 2026), a select over the half of the bar it changes, and B's one-tap openings
// under B's: his own last season, and on his own Compare the nearest rival.

/** One side's seasons: this one by its name, and the completed ones he played, most recent first. */
export interface SeasonOffer {
  name: string;
  /** This season's label, "2026/27"; null prints "This season". */
  current: string | null;
  past: readonly PastSeason[];
}

export default function SeasonBar({
  query,
  a,
  b,
  openings,
  route,
}: {
  /** Compare's query as asked, which each select carries so a pick changes only its own side. */
  query: Partial<Record<CompareField, string>>;
  /** Null for a side with no man, or none with a season before this one. */
  a: SeasonOffer | null;
  b: SeasonOffer | null;
  openings: readonly Opening[];
  route: CompareRoute;
}) {
  if (a === null && b === null && openings.length === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-1.5 lg:gap-3">
      <div className="flex min-w-0 flex-col">{a === null ? null : <Pick side="a" offer={a} query={query} route={route} />}</div>
      <div className="flex min-w-0 flex-col gap-1.5">
        {b === null ? null : <Pick side="b" offer={b} query={query} route={route} />}
        {openings.map((opening) => (
          <ButtonLink key={opening.href} href={opening.href}>
            {opening.label}
          </ButtonLink>
        ))}
      </div>
    </div>
  );
}

/** One side's select: a pick sets its season and keeps the men, the view and the other side's season. */
function Pick({
  side,
  offer,
  query,
  route,
}: {
  side: "a" | "b";
  offer: SeasonOffer;
  query: Partial<Record<CompareField, string>>;
  route: CompareRoute;
}) {
  const own = SEASON_PARAM[side];
  const other = SEASON_PARAM[side === "a" ? "b" : "a"];
  const options = [
    { value: "", label: offer.current ?? "This season" },
    ...offer.past.map((season) => ({ value: seasonValue(season.season), label: season.season })),
  ];
  const value = options.some((option) => option.value === query[own]) ? (query[own] ?? "") : "";

  return (
    <QuerySelect name={own} label={`${offer.name}'s season`} value={value} options={options} action={route.base}>
      {route.fixed === undefined ? <Carried name="a" value={query.a} /> : null}
      <Carried name="b" value={query.b} />
      <Carried name="view" value={query.view} />
      <Carried name={other} value={query[other]} />
    </QuerySelect>
  );
}
