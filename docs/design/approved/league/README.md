# `/league`: the table

Route: `/league`, signed in as The Raccoons (the reader's row lit), at 1440 and 390.

Approved by Craig, 8 Nov 2026: *"Yes"*, to the four reskin boards after the review panel and the fresh-eyes review
(`docs/design/boards/README.md` holds both, and every call decided on the way).

- [`1440.png`](1440.png), drawn from [`LeagueTable.html`](LeagueTable.html)
- [`390.png`](390.png), drawn from [`LeagueTable-390.html`](LeagueTable-390.html)

## What it borrows from CM

`cm9900/24.jpg`: the table in a panel the ground shows through, the yellow caption on a soft band, the unheaded place
and team columns, the grey head plates over the figures, the purple block for Pts, the grey `Back`/`Next` bar at the
foot. `cm9900/24.jpg` and `12.jpg`: the rail as bevelled plates with the date in yellow.

## Interaction notes

- **Rail** (desk): each plate opens its section; the current one is lit. The date and `GW11 locks 11:00` are words,
  not controls. No `◄ ►` here: the season table has no gameweek to step.
- **Tab strip**: each tab opens its view, the current one pressed in yellow. Seven on the desk; five under a thumb,
  `Team Stats` as `Stats` and Waivers and Squads left to the desk, as today.
- **A team's row**: opens that team's squad, `/squad/<teamId>`, as today.
- **A column head**: sorts by it, as today; the sorted head drawn pressed. Place and team carry no head.
- **Cut lines**: not controls.
- **Foot bar** (desk): `◄ Back` goes back a page (the browser's history); `Cups ►` opens the strip's next tab.
- **Thumb rail** (phone): as today, `Draft` lit; and the deadline plate at the top is words.

## Placeholders

None: every figure is Fantrax's standings and the form the app already joins.
