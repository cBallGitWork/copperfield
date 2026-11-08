# `/squad/[teamId]`: a squad

Route: `/squad/me` (The Raccoons), the Squad tab, at 1440 and 390.

Approved by Craig, 8 Nov 2026: *"Yes"*, to the four reskin boards after the review panel and the fresh-eyes review
(`docs/design/boards/README.md` holds both, and every call decided on the way).

- [`1440.png`](1440.png), drawn from [`Squad.html`](Squad.html)
- [`390.png`](390.png), drawn from [`Squad-390.html`](Squad-390.html)

## Held: the picture and the page disagree (8 Nov 2026)

**Not built yet.** The board was drawn from `docs/ui/squad.md`, which says the squad page is a list with no pitch on it
(Craig, 31 Aug and 6 Oct 2026). The page as served on 8 Nov is not: shot on `feat/reskin-shell`, `/squad/<team>`
draws the list beside a pitch of the eleven, a `GW` points column, and two drop-downs (team and gameweek). Building
the picture would take the pitch off a page that has one, which is a product call the picture never showed Craig.
So the Squad waits for him: keep the pitch and redraw the board around it, or take the pitch off as the picture does.
The doc is also out of step with the page, whichever way it goes.

## What it borrows from CM

`cm9900/12.jpg`: the `Inf` column beside the name, the value block (our purple FPts), the head plates.
`cm9900/25.jpg`: the team's own tabs (Squad, Transfers, Next Match, Fixtures, Stats). `cm9900/10.jpg`: the grey
`Back`/`Next` bar stepping to the next squad.

## Interaction notes

- **Rail** (desk): as on `/league`, and here `◄ ►` step the gameweek the squad shows (`?gw=`, today's picker).
- **Tab strip**: the team's five tabs, as today; `Next Match` is `Next` under a thumb.
- **A player's row**: opens his card, as today.
- **`FPts` head**: sorted, drawn pressed.
- **Bench**: its own grey plate, the order 1 to 3 as Fantrax's auto-subs read it.
- **Fixture tile**: the club and h/a only, its colour the difficulty; the words ("difficulty 2 of 10") are its
  title for a screen reader (Craig, 7 Nov 2026: *"Stop adding numbers to the fixture tile, team and h/a"*).
- **Foot bar** (desk): the teams either side in the table, `◄ Bru` and `Atletico ►`; none past the first or last.
- **Phone**: the deadline plate at the top; your own team's title bar left off for the list's room (a rival's
  keeps it, with its `←`); the complaint and return under the name.

## Placeholders

None: xMins, the doubt bands and returns, the fixtures and FPts are all read today.

## A near-black team

The bar takes the team's second colour as a bevelled plate, black ink on The Raccoons' white; the index spine takes
the league's blue, since a white spine read as column heads.
