# `/league/cups` — each cup's draw

The league's two cups, one at a time: the draw, round by round. **The cups are ours, not Fantrax's**,
declared in `league/cups/declared.ts`; PLATFORM_NOTES' *The cups are declared as ours* carries Craig's
rules (27 Sep 2026). Their fixtures are on Fixtures (`/league/fixtures`), not here.

`../rules/DESIGN.md` is binding for colour and type and this file defers to it.

## On the page

- One picker: the cup (Timbeibs Cup, Davy Propper Cup; `?cup=`), the first by default. Craig, 1 Oct
  2026: *"just put fixtures in fixtures section, too many buttons, leave brackets here"*. The Fixtures
  view went, and with it the view picker; an old `?view=` link is ignored.
- **The Timbeibs Cup** is two brackets, each side of the draw as columns of ties, first round on the
  left, scrolling sideways on a phone: the winners' side (with the final) and the losers' side. Craig,
  27 Sep: *"we really need a bracket view as well."*
- **The Davy Propper Cup** is its two groups as league tables (Craig, 1 Oct: *"propper cup should be a
  table view"*), then its knockout as a bracket. A group's columns are the league table's (Pld W D L
  For Ag Pts, Ag standing down under a thumb), its rows the draw slots A1–A5 placed by `groupTable`,
  and a dashed line under the last place through to the knockout. Until the group stage is played every
  figure is 0: no group tie has a result to count.

## Placeholder draw

Craig, 27 Sep 2026: *"Placeholder brackets are fine for now."* Nobody is seeded until GW9 is
scored, and nobody is in a group until the draw around GW19, so every side is a placeholder:
"Seed 7", a group slot "A1", a group place "2nd B", or "Winner M5" / "Loser M5", M5 being the tie
numbered 5 in the bracket. A round drawn at random (the Timbeibs Cup's first two) prints "To be drawn"
on both sides until Craig's draw fills it. Ties are numbered in the order they are played. The draw is laid out for
however many teams `getLeagueInfo` has, so a league still filling up gets a smaller bracket.

## A level tie

Craig, 19 Oct 2026: *"tie is goals scored, assists, cs, cards (least better) then toss of coin, but in rules
section in more"*. It replaces the 27 Sep order (goals, assists, clean sheets, minutes, then Craig's own toss)
and the 8 Oct ruling that he settles ties by hand.

- Every tie is one leg; the higher Fantrax score goes through. Level on points (compared in hundredths), the
  winner has, in turn: more goals, more assists, more clean sheets, fewer cards, then a coin toss.
- The figures are the counted men's, Fantrax's `ACTIVE` eleven for the gameweek after the auto-sub run, read
  by the league's own categories (`idsOf` on `getLeagueInfo`'s names, never a code): Goals, the assist total
  (`AT`, or `A` plus `AF` where a league scores no total), Clean Sheets On Field, Yellow plus Red Cards.
  **A red counts as one card, like a yellow** (Craig said "cards"; the league prices them −1 and −3, which is
  scoring, not a count). A category the league does not score counts nought for both.
- **The coin is repeatable**: FNV-1a over the cup id, both team ids sorted and the gameweek, mixed by
  MurmurHash3's finaliser, top bit. Every reader sees the same winner, and home or away makes no difference.
- The tie prints which step settled it: "Through on goals scored", "Through on assists", "Through on clean
  sheets", "Through on fewer cards", "Through on the toss of a coin"; nothing when points did.
- The rule is printed under the scoring table on `/scoring` (More › Scoring), as "Cup ties", from the same
  `CUP_TIE_STEPS` the decider walks.
- `packages/core/src/league/cups/tieBreak.ts`: `tieTally`, `decideTie`, `coinToss`, `throughOn`, tested in
  `tieBreak.test.ts`. **No tie calls it yet**: no cup tie has two teams until the draw is entered (below).

## What the draw still needs

Today every GW10 and GW11 side prints "To be drawn" and nothing puts a team into a slot. Before GW10:

- **The GW9 seeding**: nothing reads GW9's points into seeds (the reader was deleted in #378). They only split
  the six byes from the four in round 1.
- **The draw itself**: Craig draws rounds 1 and 2 off the app; there is no file or form to enter who he drew,
  so the bracket cannot name a team.
- **Cup results**: no read puts each side's GW points and counted men's categories against a tie, so
  `decideTie` has no caller and Bracket, Fixtures and Live cannot print a winner or a "Through on" line.

## States

- Fantrax silent: `getLeagueInfo` refused, so there is no team count to draw for.
- Fewer than two teams: "No draw yet".
