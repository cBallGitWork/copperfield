import type { SquadPlayerDetail } from "@epl/core";
import PositionTile from "../../../components/league/PositionTile";
import { chipsFor } from "../../../components/league/Chips";
import { MaybeCard } from "../../../components/league/PlayerCardButton";
import SubNote from "./SubNote";
import LeadFace from "../../../components/league/LeadFace";
import LeagueHolder from "../../LeagueHolder";
import type { Holders } from "../../holders";
import { ROW_RULE } from "@/app/desk";
import { appeared, type Join, type Named } from "./sheetJoin";

// One man's row on the team sheet, and the card it opens, his holder tag after his name. No doubt mark or wash: today's
// flag has no business on a match already played (docs/ui/match.md).

/** Chips a row shows before it stops; the second only on a desk. */
const MARKS = 2;

/** The trigger's box, centred in the row: a tap row's 36 under a thumb. */
export const NAME_CELL = "flex min-h-9 w-full items-center px-1.5 text-left hover:underline";

/** Chips the card block already draws, so the row does not say them twice. */
const CARDED = new Set(["YC", "RC"]);

export default function SheetRow({
  row,
  holders,
  positions,
  join,
  card,
  hurt,
  opensBench,
}: {
  row: Named;
  holders: Holders;
  /** The positions the league fields him at; empty when it does not know him. */
  positions: readonly string[];
  join: Join;
  /** The app's player card for him, or none where the league does not list him. */
  card: SquadPlayerDetail | undefined;
  hurt: boolean;
  opensBench: boolean;
}) {
  const { man, did } = row;
  // Grey is "not on the pitch at the whistle" — CM's `cm9900/02.jpg` rule.
  const finished = appeared(row) && did?.offAt == null;
  const line = join.line(man.code);

  return (
    <tr
      className={`${ROW_RULE} ${finished ? "" : "cm-out"} ${
        opensBench ? "border-t-4 border-t-bg" : ""
      }`}
    >
      <PositionTile positions={positions} cell />
      {/* CM's card block between the index and the name. */}
      <td className="w-3 px-0">
        {did?.sentOff != null ? (
          <span className="block h-5 w-2.5 rounded-[1px] bg-bad" title={`Sent off ${did.sentOff}'`} />
        ) : did?.booked != null ? (
          <span className="block h-5 w-2.5 rounded-[1px] bg-accent" title={`Booked ${did.booked}'`} />
        ) : null}
      </td>
      <td className="min-w-0 p-0">
        <MaybeCard player={card} className={NAME_CELL}>
          {/* One position per row: the Fantrax tile; the real one is on the card (Craig, 23 Sep 2026). */}
          {/* The desk's own row size (Craig, 23 Sep 2026: *"smaller, seem quite big"*). */}
          <LeadFace
            name={man.name}
            after={
              <>
                {man.captain ? <span className="shrink-0 text-2xs text-faint">(c)</span> : null}
                <LeagueHolder code={man.code} holders={holders} className="" />
                <SubNote onAt={did?.onAt} offAt={did?.offAt} added={did?.added} hurt={hurt} />
              </>
            }
          />
        </MaybeCard>
      </td>
      <td className="w-9 whitespace-nowrap px-1 text-right lg:w-16">
        <span className="inline-flex items-center gap-0.5">
          {(line === undefined ? [] : chipsFor(line))
            .filter((chip) => !CARDED.has(chip.label))
            .slice(0, MARKS)
            .map((chip, at) => (
              <span
                key={chip.label}
                className={`rounded-[1px] px-1.5 py-0.5 text-2xs font-bold lg:text-xs ${at > 0 ? "hidden lg:inline" : ""} ${chip.className}`}
              >
                {chip.label}
              </span>
            ))}
        </span>
      </td>
    </tr>
  );
}
