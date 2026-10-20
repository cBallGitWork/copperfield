# `/gw/[gameweek]` — one round of football

Any round of the season, addressable. Last week's results on Monday morning is
the second thing anyone wants after this week's score.

Drawn by `GameweekView`, which only this route uses. Linked from each "N yours" on Prem › Fixtures and from Live's between-rounds panel.

## On the page

- Header: the Premiership's cream competition bar titled **Gameweek N**, with the `←` back plate (to Prem ›
  Fixtures at that gameweek), and the line under it: **LIVE** with the pulsing dot while a match is on, otherwise,
  while it is ahead, **Line-ups lock** and the league's own time. The route reads the lock (`lockAhead`) and
  `GameweekView` takes it as plain data. Framed like the Prem screens since 16 Oct 2026 (Craig: "3 yours goes to a
  bugged screen" once #526 linked it): the list sits in the desk's panel, never on the bare photograph, and the
  "Updated" line sits inside it.
- **The day under the kickoff time** — `Sat`, `Sun`, `Mon`, in the small line
  that carries `FT` once the match is over and is empty until it starts. Without
  it the list is sorted by instant and reads as scrambled: 17:30 above 14:00
  because one is Saturday and the other Sunday. Not folded into the time above
  it, which is the slot the score lands in.
- **`MatchList`** — every fixture in kickoff order, undated TV picks last. Each
  fixture is a native `<details>`, so the drop-down works with no JavaScript, is
  keyboard operable and screen-reader announced for free. Open one and you get
  who did what: goals, assists, cards, notable saves, ordered by impact (FPL's
  bonus left it on 6 Oct 2026: the FPL tab's alone).
  Merely turning out does not qualify — the drop-down answers "what happened",
  not "who played". The foot of every opened row, played or not, is a **Match ›**
  link to `/prem/match/[id]`, in the body rather than the summary so a tap on the
  row still only opens it. The score prints as Prem's does, `1:3` in the reading
  cyan through `Scoreline`.
- **Your players marked.** A fixture with one of the reader's men in it carries
  the accent edge (`yoursEdge`, the same mark as every other "this is yours"
  row) and a counted `2 yours` in the summary. A reader's every row holds the
  count's fixed column and a clear edge of the same width, empty where he has
  nobody, so the scores stay on one line; signed out, neither is held. Open it and a **Yours ·
  Saka · Gabriel** line sits above the contributions — a different question from
  the one below it, because "which of mine is in this match" has to include the
  man who has done nothing, which on a Saturday is most of them.

  Counted rather than tinted: fifteen players across ten fixtures marks most of
  the list, and every row marked is no row marked. The number is what ranks one
  match above another at a glance.
- **Ownership tags on the events.** Under each contributor's name in the
  drop-down, the squad that holds him — yours in accent, everyone else's faint,
  and a footballer nobody in the league holds untagged. Every goal in the round
  answers "whose player is that", which is the one line of Soccer Saturday the
  app was missing. Untagged rather than "—": most of the 697 are on no roster.

  Independent of the marks above. A **signed-out** reader gets the tags and no
  `n yours` — whose player that was is not a question about him.
- Previous / Next round links, bounded by the season FPL actually published, not
  a hardcoded 38. Each end renders an inert placeholder so the other link does
  not slide across the screen.
- One line at the foot: `Updated 11:08.`, or `Scorers not available right now.`
  when the player stats are missing, **so the goals below read as missing rather
  than nil**. It names no source.

## Data

FPL's public API for all of the football. The page **degrades to exactly that**:
signed out, undrafted, or Fantrax silent, the `mine` prop is simply absent and
the round renders byte-identical to the version that had never heard of a
fantasy league. It has no Fantrax-shaped empty state because it has no Fantrax-
shaped claim to make.

`fixtureInvolvement` and `owners` are pure joins in core, keyed off **squad
membership** — public all week. Nothing here reads a lineup, in either
direction. `owners` keys on FPL's season-stable `code`, never the recycled `id`.

**Historical rounds are marked from today's squad**, deliberately. "Which of
these results matter to me" is asked on Monday by the man who owns those players
*now*; a squad as it stood in week six would need `getTeamRosters?period=`, which
has never been proven to serve history.

## Known gaps

- Nothing marks the *opponent's* players. Whether a manager misses it is a
  question for a real Saturday — recorded as open rather than built, because the
  second mark competes with the first for the same row.
- The drop-down is still plain.
