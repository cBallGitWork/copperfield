# `/squad/[teamId]/fixtures`: a squad's Fixtures

Route: `/squad/<teamId>/fixtures`, at 1440.

Approved by Craig, 8 Nov 2026 (*"Yes, approve"*), after the four-reviewer panel, in the whole-site pass.

- [`1440.png`](1440.png), drawn from [`SquadFixtures.html`](SquadFixtures.html)

## What it borrows from CM

`cm9900/24.jpg`: one head strip across the table, the index block down its left.

## What changed from the page as served

- One head strip over every column: `GW`, `Date`, `Opponent`, `Competition`, `Res`, `Score`.
- The gameweek alone in its index block, the date in its own column, so the blocks no longer change width.
- Opponents in plain white: a team's colour beside a result would read as a W or an L (the panel).
- The competition in cyan, mixed case (`League`, never `LEAGUE`).
- A played tie's result as `W`, `L` or `D` in its own column, gain green, loss red, draw muted; the score in cyan.
  The tie being played says `Live` there and has no result yet.
- To come first, this gameweek on the accent edge, then `Played`, newest first (the doc's order).

## Interaction notes

- **A row**: opens the tie, as today. **Foot bar**: `◄ Match` and `Stats ►`.

## Placeholders

None. The panel struck a drawn cup row: the season holds one score per team per gameweek.
