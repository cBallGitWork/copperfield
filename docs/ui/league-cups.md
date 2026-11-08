# `/league/cups` — each cup's draw

The league's two cups, one at a time: the draw, round by round. **The cups are ours, not Fantrax's**,
declared in `league/cups/declared.ts`; PLATFORM_NOTES' *The cups are declared as ours* carries Craig's
rules (27 Sep 2026). Their fixtures are on Fixtures (`/league/fixtures`), not here.

`../rules/DESIGN.md` is binding for colour and type and this file defers to it.

## On the page

- One picker: the cup (Tims INFUSR Energy Cup, Davy Propper Cup; `?cup=`), the first by default, docked in `FootFrame`'s
  foot above the thumb rail so the top keeps Draft's own strip alone (20 Oct 2026). Craig, 1 Oct
  2026: *"just put fixtures in fixtures section, too many buttons, leave brackets here"*. The Fixtures
  view went, and with it the view picker; an old `?view=` link is ignored.
- **The Tims INFUSR Energy Cup** is two brackets, each side of the draw as columns of ties, first round on the
  left, scrolling sideways on a phone: the winners' side (with the final) and the losers' side. Craig,
  27 Sep: *"we really need a bracket view as well."*
- **The Davy Propper Cup** is its two groups as league tables (Craig, 1 Oct: *"propper cup should be a
  table view"*), then its knockout as a bracket. A group's columns are the league table's (Pld W D L
  For Ag Pts, Ag standing down under a thumb), its rows the draw slots A1–A5 placed by `groupTable`,
  and a dashed line under the last place through to the knockout. Until the group stage is played every
  figure is 0: no group tie has a result to count.

## Seeds and placeholders

**The Tims INFUSR Energy Cup is seeded 1–10 off GW9** (Craig, 4 Nov 2026: *"fill in the bracket with hard seeds
1-10"*), recorded in `data/leagues/cup-seeds.json` and read by `app/cupSeeds.ts`; a league missing any of the file's
teams (demo) stays unseeded. A seeded side prints its team; every other side is still a placeholder: "Seed 7", a
group slot "A1", a group place "2nd B", or "Winner M5" / "Loser M5", M5 being the tie numbered 5 in the bracket.
Ties are numbered in the order they are played. The draw is laid out for
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
  `tieBreak.test.ts`. **No tie calls it yet**: the counted men's categories are not read (below).

## Scores and winners

Craig, 8 Nov 2026: *"update the cup brackets"*. A tie's score is its two teams' totals for the gameweek, off the
season's results keyed by the round's period (`cupStanding`, over core's `cupDraw`). The bracket prints each side's
score in cyan once a ball is kicked in its gameweek; once the gameweek is over and the points part them, the loser
greys and both the winner and the loser are carried into the ties that wait on them ("Winner M1" becomes the team).
Live and Fixtures name a later round's sides from the same settled ties (`cupsDecided` into `roundTies`).

## What the draw still needs

- **A level tie**: no read puts the counted men's categories against a tie, so `decideTie` still has no caller. A tie
  level at full time keeps both sides in ink and its "Winner"/"Loser" slots stay placeholders until it does.

## States

- Fantrax silent: `getLeagueInfo` refused, so there is no team count to draw for.
- Fewer than two teams: "No draw yet".
