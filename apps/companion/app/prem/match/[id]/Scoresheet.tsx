import { fullFootballerName, goalGroups } from "@epl/core";
import type { FootballPlayer, PlGoal, PlManMatch, SheetRow, SquadPlayerDetail } from "@epl/core";
import type { Holders } from "../../holders";
import { Goal, Man } from "./ScoreRows";
import { forCode } from "./sheetJoin";
import { minuteMark } from "./minuteMark";

// Who scored, when and who made it — CM's `cm0102/02.jpg`, home down the left and away down the right.
// One line per SCORER with all his minutes (`goalGroups`), his assisters quieter under him; an assister carries a
// minute only where it would not repeat the scorer's — two assisters on a brace, or one on a hat-trick.

export default function Scoresheet({
  home,
  away,
  homeElse,
  awayElse,
  holders,
  byCode,
  did,
  injured,
  cards,
}: {
  /** One side's goals, oldest first, assisters reconciled against FPL's counts. */
  home: readonly PlGoal[];
  away: readonly PlGoal[];
  /** Men named for something that is not a goal — a sending off, a penalty missed, a man carried off. */
  homeElse: readonly SheetRow[];
  awayElse: readonly SheetRow[];
  /** Who holds each man, for the tag after his name. */
  holders: Holders;
  byCode: Map<number, FootballPlayer>;
  /** The Premier League's events per man, for the minute of a sending off FPL's line does not carry. */
  did: Map<number, PlManMatch>;
  /** Who went off hurt, and when — the commentary is the only place that says so. */
  injured: ReadonlyMap<number, number>;
  /** Each named man's card, by code — a name opens his card, not his page. */
  cards: ReadonlyMap<number, SquadPlayerDetail>;
}) {
  const empty =
    home.length === 0 && away.length === 0 && homeElse.length === 0 && awayElse.length === 0;
  if (empty) {
    return (
      <p className="py-2 text-center text-2xs text-faint">Nobody was named on the scoresheet.</p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-1">
      <SheetSide goals={home} rest={homeElse} holders={holders} byCode={byCode} did={did} injured={injured} cards={cards} />
      <SheetSide goals={away} rest={awayElse} holders={holders} byCode={byCode} did={did} injured={injured} cards={cards} />
    </div>
  );
}

/** One side of the sheet: its scorers, then its men named for anything else. */
function SheetSide({
  goals,
  rest,
  holders,
  byCode,
  did,
  injured,
  cards,
}: {
  goals: readonly PlGoal[];
  rest: readonly SheetRow[];
  holders: Holders;
  byCode: Map<number, FootballPlayer>;
  did: Map<number, PlManMatch>;
  injured: ReadonlyMap<number, number>;
  cards: ReadonlyMap<number, SquadPlayerDetail>;
}) {
  return (
    <ul className="flex max-w-[26rem] flex-col gap-1">
      {goalGroups(goals).map((group, at) => (
        <Goal
          // The index too: two goals nobody can place, in one minute, are two rows.
          key={`${group.scorer ?? "?"}-${group.own}-${group.minutes[0]}-${at}`}
          group={group}
          holders={holders}
          byCode={byCode}
          cards={cards}
        />
      ))}
      {rest.map(({ player, line }) => {
        // A sending off outranks an injury, an injury a missed penalty. The fixture feed times the injury, added time
        // and all, so this sheet and Line Ups agree; the commentary only says he was hurt.
        const man = forCode(did, player.code);
        const hurtAt =
          player.code === null || !injured.has(player.code)
            ? undefined
            : (man?.offAt ?? injured.get(player.code));
        return (
          <li key={player.id}>
            <Man
              code={player.code}
              card={forCode(cards, player.code)}
              name={player.name}
              short={fullFootballerName(player)}
              holders={holders}
              // The fixture feed's off minute carries its added time; the commentary's fallback does not.
              figure={marks(line, man, hurtAt, man?.offAt == null ? undefined : man.added?.offAt)}
              glyph={line.redCards > 0 ? "card" : hurtAt === undefined ? null : "cross"}
              glyphTone="text-bad"
            />
          </li>
        );
      })}
    </ul>
  );
}

/** What a man is on the sheet for when it is not a goal: the minute where there is one, the word where not. */
function marks(
  line: SheetRow["line"],
  did: PlManMatch | undefined,
  hurtAt: number | undefined,
  hurtAdded: number | undefined,
): string {
  const said: string[] = [];
  if (line.penaltiesSaved > 0) said.push("pen saved");
  if (line.penaltiesMissed > 0) said.push("pen missed");
  if (line.redCards > 0) said.push(did?.sentOff == null ? "red" : minuteMark(did.sentOff, did.added?.sentOff));
  if (hurtAt !== undefined) said.push(minuteMark(hurtAt, hurtAdded));
  return said.join(" · ");
}
