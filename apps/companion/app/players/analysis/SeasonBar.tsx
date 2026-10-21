import type { PastSeason } from "@epl/core";
import QuerySelect from "../../components/shell/QuerySelect";
import ButtonLink from "../../components/shell/ButtonLink";
import { ANALYSIS, compareHref, seasonValue, type CompareField } from "../routes";
import { Carried } from "./PickBar";
import { SEASON_PARAM } from "./season";

// Each side's season (Craig, 21 Oct 2026), a select over the half of the bar it changes, and one tap to set a man
// against his own last season when the other side is empty or him again.

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
  self,
}: {
  /** Compare's query as asked, which each select carries so a pick changes only its own side. */
  query: Partial<Record<CompareField, string>>;
  /** Null for a side with no man, or none with a season before this one. */
  a: SeasonOffer | null;
  b: SeasonOffer | null;
  /** A's own last season, offered when B is empty or A again; null when it is not. */
  self: PastSeason | null;
}) {
  if (a === null && b === null && self === null) return null;
  const versus =
    self === null ? null : compareHref({ a: query.a, as: query.as, b: query.a, bs: seasonValue(self.season), view: query.view });

  return (
    <div className="grid grid-cols-2 gap-1.5 lg:gap-3">
      <div className="flex min-w-0 flex-col">{a === null ? null : <Pick side="a" offer={a} query={query} />}</div>
      <div className="flex min-w-0 flex-col gap-1.5">
        {b === null ? null : <Pick side="b" offer={b} query={query} />}
        {versus === null ? null : (
          <ButtonLink href={versus}>
            vs his last season
          </ButtonLink>
        )}
      </div>
    </div>
  );
}

/** One side's select: a pick sets its season and keeps the men, the view and the other side's season. */
function Pick({ side, offer, query }: { side: "a" | "b"; offer: SeasonOffer; query: Partial<Record<CompareField, string>> }) {
  const own = SEASON_PARAM[side];
  const other = SEASON_PARAM[side === "a" ? "b" : "a"];
  const options = [
    { value: "", label: offer.current ?? "This season" },
    ...offer.past.map((season) => ({ value: seasonValue(season.season), label: season.season })),
  ];
  const value = options.some((option) => option.value === query[own]) ? (query[own] ?? "") : "";

  return (
    <QuerySelect name={own} label={`${offer.name}'s season`} value={value} options={options} action={ANALYSIS}>
      <Carried name="a" value={query.a} />
      <Carried name="b" value={query.b} />
      <Carried name="view" value={query.view} />
      <Carried name={other} value={query[other]} />
    </QuerySelect>
  );
}
