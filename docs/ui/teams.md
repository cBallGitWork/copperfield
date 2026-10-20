# `/players/teams` — Clubs

**Labelled Clubs since 16 Oct 2026** (Craig: Teams → Clubs, "OK"; in a fantasy app "Teams" read as the ten managers'
sides). Label only: the route and the strip's key stay `teams`, because a URL outlives a label.

Craig, 24 Sep 2026: *"we're going to need a team stats section, contains all data for that, cm-ify it"*; and
30 Sep 2026: *"this page should be more pure stats, chances created, shots etc, errors"*. Prem's own one-measure
board, `/prem/team-stats`, was cut on 19 Oct 2026 and redirects here; this is every club's football on one board. No fantasy points of
anybody's, and no fixture run: the Planner owns that.

## On the page

Twenty clubs, twenty-two measures in four groups. Under a thumb a row of plates (Attack, Chances, Defence,
Discipline; `?group=`, an absent or unknown one Attack) draws one group's columns, with the Key beside it listing
that group's heads alone; Defence's eight still scroll sideways inside it. From `lg` there are no plates: every
column side by side under its group's head. Errors folded into Discipline on 20 Oct 2026, since five plates did not
fit one line at 320 in WebKit.

| Group | Heads | Whose, and how |
|---|---|---|
| Attack | G Sh SoT BC xG | Opta's goals, shots, on target, big chances scored or missed; FPL's squad xG |
| Chances | A KP BCC xA | Opta's assists, key passes (passes that led to a shot), big chances created; FPL's squad xA |
| Defence | GC xGC CS ShA Tk Int Rec Blk | Opta's conceded, clean sheets, shots conceded, tackles, interceptions, ball recoveries, blocks; FPL's squad xGC over eleven |
| Discipline | ErS ErG Fls YC RC | Opta's errors leading to a shot and to a goal, fouls committed, yellow and red cards |

Each head carries its meaning in a `title`. Standouts are lit in ink over the twenty (a fifth yellow, a tenth
orange); where more is worse (GC xGC ShA ErS ErG Fls YC RC) the top of the column is red. A played nought is white.
Sort is a link (`?sort=&dir=`), a column opening at its good end. A plate orders by its lead column (G, A, GC, ErS)
and clears the reader's sort; a `?sort=` names its column's plate, so the order is never hidden. Ties fall to the
name. A club opens the Players board at that club.

## States

- **The Premier League refuses**: every Opta column is a dash; FPL's expected three still draw.
- **FPL files nobody at a club**: its expected three are a dash.
