import { byPositionDepth, type CategoryBand } from "@epl/core";
import { leaguePositionLabel } from "../../positions";

/** Each band's plate title by code: its name, and where two share one ("Goals conceded" in goal and on the pitch),
 *  the slots its men stood in, back to front ("Goals conceded · GK"); its code where no slot is known. */
export function bandTitles(
  bands: readonly CategoryBand[],
  slotOf: (fantraxId: string) => string | null | undefined,
): Map<string, string> {
  const shared = new Set(bands.map((band) => band.name).filter((name, at, names) => names.indexOf(name) !== at));
  return new Map(
    bands.map((band) => {
      if (!shared.has(band.name)) return [band.code, band.name];
      const slots = [...new Set([...band.mine, ...band.theirs].map((man) => slotOf(man.fantraxId) ?? ""))]
        .filter((slot) => slot !== "")
        .sort(byPositionDepth);
      const by = slots.length === 0 ? band.code : slots.map(leaguePositionLabel).join("/");
      return [band.code, `${band.name} · ${by}`];
    }),
  );
}
