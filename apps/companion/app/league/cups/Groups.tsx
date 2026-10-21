import { groupTable, ordinal, type GroupStage } from "@epl/core";
import StandingsTable, { StandingsName, type StandingsColumn } from "../../components/league/StandingsTable";
import { BLOCK_PLATE } from "@/app/desk";

/** Each group as a league table, its slots in draw order until there are results to place them. */
export default function Groups({ groups, stage }: { groups: readonly string[][]; stage: GroupStage }) {
  return (
    <div className="flex flex-col gap-4">
      {groups.map((slots, at) => (
        <section key={slots[0] ?? at} className="flex flex-col gap-1">
          <h2 className={BLOCK_PLATE}>Group {slots[0]?.charAt(0)}</h2>
          <StandingsTable
            columns={COLUMNS}
            lines={groupTable(slots, [], stage.points).map((row, place) => ({
              key: row.teamId,
              place: ordinal(place + 1),
              name: <StandingsName>{row.teamId}</StandingsName>,
              values: {
                played: row.played,
                won: row.won,
                drawn: row.drawn,
                lost: row.lost,
                for: row.pointsFor,
                against: row.pointsAgainst,
                pts: row.points,
              },
              cuts:
                place + 1 === stage.qualify && place + 1 < slots.length
                  ? [{ label: "Knockout", tone: "border-accent/80" }]
                  : [],
            }))}
          />
        </section>
      ))}
    </div>
  );
}

/** The figures, as the league table heads them; Ag stands down under a thumb so Pts fits at 390. */
const COLUMNS: readonly StandingsColumn<string>[] = [
  { key: "place", kind: "place", label: "Placing", title: undefined, width: "w-8 lg:w-14" },
  { key: "name", kind: "name", label: "Team", title: undefined, width: "" },
  { key: "played", kind: "figure", label: "Pld", title: "Played", width: "w-8 lg:w-20" },
  { key: "won", kind: "figure", label: "W", title: "Won", width: "w-7 lg:w-16" },
  { key: "drawn", kind: "figure", label: "D", title: "Drawn", width: "w-7 lg:w-16" },
  { key: "lost", kind: "figure", label: "L", title: "Lost", width: "w-7 lg:w-16" },
  { key: "for", kind: "figure", label: "For", title: "Fantasy points scored", width: "w-11 lg:w-24" },
  { key: "against", kind: "figure", label: "Ag", title: "Fantasy points conceded", width: "w-11 lg:w-24", deskOnly: true },
  { key: "pts", kind: "points", label: "Pts", title: "Group points", width: "w-10 lg:w-24" },
];
