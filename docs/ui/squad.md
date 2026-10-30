# `/squad/[teamId]` — one manager's squad

**The reference page for the current visual direction.** Rebuilt 19 Aug 2026.

## Who opens it and why

Mostly somebody else's squad: the matchup card, the standings and the squad list
all lead here. The questions are "who has he got", "who does he play this week",
and "is that man fit". The page knows whose squad it is (`mine`) and says so in
the title.

## The front door — `/squad/me`

**The My Team section's front door** (Craig, 21 Sep 2026); its plate reads
`Team`, which is what fits at 320. `me` is a segment this route
accepts in place of an id and resolves against the rostered teams. A reader with
no team is shown the squad index and its sign-in at `/squad/me` itself
(`SquadIndex`, 16 Oct 2026), so the Team tab he tapped stays lit; it redirected
to `/squad` until then, which lit Draft. His other four tabs still send him to
`/squad`. A good code lands on `/squad/me`. `squad/routes.ts`
carries the constants and the reason it is a URL rather than a redirect: the
rail is a client component and the id is in a signed HTTP-only cookie, so a
plate pointing at `/squad/<your id>` would mean `cookies()` above every route in
the app — the paper going dynamic to light a nav plate.

Two things follow, and both are in `team.ts`:

- **`whoseTeam(slug, teams)` is the one resolver**, extracted at three — this
  page, the Match tab and `leagueTeams` each read their own roster and each had
  to answer it. It returns the id AND whether it is the reader's, because both
  callers that want the second want it against the list they resolved from.
- **`TeamIdentity.slug` is what the URL said**, and the tab strip builds its five
  hrefs from it rather than from the id. A manager who came in through My Team
  therefore stays inside `/squad/me/*` across Transfers, Match, Fixtures and
  Stats, and the plate stays lit. Following the id instead would drop him onto
  the same screens under a pathname the rail no longer recognises.

  **The door is not the only way in, and the other ways do not light it.** The
  league table, Team Stats, the matchup sides and the schedule all link a team by
  id, including when that team is yours — so your own squad has two pathnames and
  only one of them marks the rail. The index's own row goes through the door;
  the rest are unconverted and it is a deliberate open question rather than an
  oversight.

The section owns exactly `/squad/me` and not the `/squad` prefix, so a rival's
squad never lights a plate that says My Team.

## Three different pages behind one route

| When | What renders |
|---|---|
| **Your own team, the open week** | `LineupPlanner` — XI on the pitch, bench under it, one target per player. See below. |
| Your own team, any other week | `TeamSheet`, read-only, as a rival's locked one. See the gameweek picker below. |
| A rival, his period open | `TeamSheet` — his eleven on the grass and his bench in a strip under it, read-only, with Fantrax's points and FPL's goals on each player, and every one of them opening the live card. The head-to-head board ([matchup.md](matchup.md)) draws the same component. |
| A rival, his period not open | `SquadBoard` — fifteen names, no arrangement. See below. |

**The gate is about rivals, not about you.** Your own lineup is visible to you
all week, because you are looking at it in Fantrax anyway and planning only
matters *before* the deadline. Every other team's waits for its period to open.
`teamDisplay(squads, mine)` answers for the one team on screen; the league-wide
`squads.display` stays a rival's answer and must, because things like the
matchups board's pending clean sheets read it for all ten at once.

## The gameweek picker

Craig, 1 Oct 2026: *"lets have a gameweek dropdown like fantrax does, shows their opp for that week (and
previous week would show their score)"*. The picker (`shell/QuerySelect`) sits beside the Pitch/List toggle on every branch
(alone at the right above `lg`), with the team picker beside or above it, and sets `?gw=`. Its options are the weeks the league plays (`leagueWeeks`): one
per period of its own calendar (`readCalendar`, from `getLeagueInfo`'s periods, never FPL's gameweek list) that its
schedule pairs anybody in. The real league's calendar carries all 38 periods and its schedule starts at period 6,
so the picker starts at Gameweek 6. A `?gw=` the league does not play (5, 99) opens the default week with its
picker (`askedWeek`). `weekStanding` (`weeks.ts`, tested) says where the week on screen stands against the open one:

| Week | Your own | Each man shows |
|---|---|---|
| Locked (played or in play) | read-only `Sheet`, captioned `Gameweek 6 · 43` (the XI's total, `sheetCaption`) | his score that week, on the grass and under GW |
| Open | `LineupPlanner`, the only week Save touches | his opponent; FPts is the season |
| Ahead | read-only `Sheet` | his opponent; no FPts column, because Fantrax answers a future week with noughts |

A rival's weeks follow the gate as before: locked weeks draw his sheet, the open and later ones his squad.
A locked sheet's caption is the same for both (16 Oct 2026: "First-choice XI" sat over a played 43 and never said
43); an open or later week keeps "First-choice XI". The bench stays off the grass, a reserve having no place in a
formation; List has it. A change made with an unsaved lineup goes through `LeaveGuard`'s prompt like any link.

## The team picker

21 Oct 2026: *"a dropdown where you select a different draft team. Quick access"*. A second `QuerySelect`
(`team`, every rostered team in table order, each led by its place as the table prints it, `1st` to `10th`
and `=3rd` for a shared place; `teamOptions`, tested; Fantrax's order, unplaced, when the table does not answer) opens another squad **at the week on screen**: it submits to `/squad`,
whose `teamPick` (`squad/routes.ts`, tested) redirects to `/squad/[teamId]?gw=`, so it works with no script.
On a rival before his lock it fills the gap left of the week (`fill`); where the Pitch/List toggle shares the
week's row (the planner, any sheet) it takes a line of its own above. Above `lg` it sits at the right.

## How the data reaches the view

The page joins the squad **on the server**, once, with `squadDetail()` in core:
each roster slot arrives at the board already carrying its club, its fixtures for
the round, and its points. The three views never look anything up.

That is worth keeping. Before it, the pitch, the list and the card each asked the
same two questions of the same two maps, which meant shipping every club in the
league and every fixture in the round to a phone so fifteen players could look
two of them up. `squadDetail` is pure and tested; if a fourth view appears, give
it a `SquadPlayerDetail` rather than the maps.

`SquadPlayerDetail.points` has **three** states and they are not
interchangeable: `undefined` (no table at all — the column disappears), `null`
(the table answered and does not name him — a dash), or a number.

The page refreshes at the live rate while the round is under way and at the idle
one otherwise — the same cadence as every other screen, because **the shell owns
the app's only poller** and the round is a fact about the shell. This page used
to mount its own, and so did seven others; `revalidate`
bounds how stale the cache may get and pushes nothing to a phone already open on
the sofa, so the score under fifteen faces sat still through a whole half.

## SquadBoard, in reading order

**It is a list, and there is no pitch on it** (Craig, 31 Aug). This board draws
FIFTEEN with no arrangement, because the arrangement is what the gate withholds —
and a pitch is a drawing of a shape, so fifteen men in position lines is a
diagram of something nobody picked. Championship Manager's own squad screen is a
table for the same reason (`cm9900/25.jpg`). `SquadPitch` was deleted with the
toggle that switched to it; the eleven that IS a shape keeps its pitch on the
head-to-head and the planner, and `### The pitch` below describes those two and
no longer describes this one.

1. **A player count**, and nothing else on that line. There is no view to choose
   between any more.
2. **One short line, only when something is off.** Three of the four gate reasons
   are a failed read and share one line, "Lineup not available right now", with the
   reason on the element as `data-code` (12 Oct 2026). The fourth,
   `not-started`, is the ordinary state of every squad most of every week and is
   deliberately silent — the header already says "squad", and a paragraph
   explaining the normal case cost the pitch a screenful on a phone.
3. **The list** (`SquadRows`) — all fifteen, alphabetical inside each position
   group, which is the order the gate requires.
4. **Nothing beside it** (Craig, 6 Oct 2026: *"huge table next to the list, needs to be pitch?"*). The season
   grid stood beside the list above `lg` until then and came off: the Stats tab already carries the season, and a
   pitch of fifteen would draw the shape the gate withholds. The list takes the full width at both sizes.
5. **The player card** (`PlayerCard`) over the top, when one is tapped: who he is, his fitness line, his last three matches over
   our league's points with his FPts as the list prints them at the head, his next five on their difficulty with his
   **xMins** under each (`WeekStrip`, inked by risk as the list is), and the news folded to its headline. The gameweek
   sheet hands it his breakdown in place of the FPts figure.

**One list on every branch** (Craig, 21 Oct 2026: *"my team is the one that's wrong"*). The gate's `SquadBoard`, a
sheet's List (`TeamSheet` in `ListAndPitch`), your own planner and the head-to-head's unplayed side all print the same
`SquadRows` in one flush panel (`PANEL_FLUSH`), so the position tiles meet the panel's edge as a spine; `SquadRows`
never draws a panel of its own, and its caller frames it. The head strip is the house's (`TableHeads`): minor caps,
nothing over the tile, crest and name, and the figure plates butted with no gap, as on every board. The **bench**
sits in the same list under a `Bench` plate (`PLATE_START`, as a board's tail), never in a box of its own with a
second list. The points head says whose points: **FPts** for the season (the gate and the planner), **GW** for the
gameweek on screen (any sheet), **Proj** for a projected season. The crest is `LeadFace`'s, 20px in a 24px cell.

Every list of the squad carries an **xMins** column for the gameweek the picker shows, between the
opponent and FPts (Craig, 7 Oct 2026: *"assign the xmins by gameweek"*). **Inked by risk** (Craig, 21 Oct 2026:
*"could change the xmins colour too, Red bad etc"*; `minutesInk`): under `START_DOUBT_MINUTES` (50) in the loss red,
otherwise the derived cyan, a dash included. A greyed bench row greys it as before. A week the export starts after (the
gameweeks already played) has no column at all rather than a column of dashes; the head-to-head board has none.
**Dated once** (16 Oct 2026): "xMins as of Thu 15 Oct", quiet, under the whole list (the bench included, 21 Oct), and
on the player card at the head of its Next row. The day is the export's (`XMINS_AS_OF`); undated, Friday's
figure passed for Monday's.

**FPts prints in the reading cyan** (Craig, 21 Oct 2026: *"put fpts in cyan too"*; DESIGN §3's Cyan row): the column
was amber on every row, the standout slot lit for nobody in particular. "Proj" takes the same ink. Live's Top stats
FPts list follows (`lists.figureInk`); its xG and xA lists keep the lone figure's amber. **DCP on the Stats board lost
its cyan** the same day (`statViews.measureInk`): our DefCon points take the board's standout lights like any count,
since cyan on a board is the league's points alone. **The Stats board's row** (21 Oct 2026, D-12/D-14): our position
in the index tile at both widths, as the list has it, then the crest, I. Surname (`fullPlayerName`, not the shirt name
that printed "Rogers"; `stats/roster.ts`) and CM's mark where the word box stood; the note after it on a desk alone,
since a phone's 160px name cell cut it to "K…" (30 Oct 2026, review round 5 A2).

Under a thumb the name takes the room (Craig, 11 Oct 2026: *"opponent should be further to the right on mobile
as it cuts off names"*): the opponent is headed Opp and is 44px, xMins and FPts 36, the figures butted and a 4px gap
between tile, crest, name and figures. Counted on his squad at 390, 4 of 14 names truncated (S. Lammens, Matheus N.,
K. Dewsbury-Hall, J. Hinshelwood beside his DBT) in a 75px column; the column is 141px now and the widest, Hinshelwood
with his box, is 131.5 (`SquadRows.test.ts`).
**Why he may miss and when he is back** print after his mark in quiet `text-2xs` ink, the return as a gameweek: "Back
injury", "Knee · GW10", "Hamstring · GW10", "Suspended · GW9" (Craig, 22 Oct 2026: *"should be global"*, *"put back
gwx"*, *"dont put percentages in this row"*).
The word is the complaint before FPL's " - " ("Back injury" stays whole, or it reads as a return). The return is the
squads export's `expectedReturnGw` past the open gameweek, else FPL's fixed "Expected back 1 Nov" or "Suspended until"
date turned into the first gameweek starting on or after it; a date is never printed, nor a chance, and a man who has
left shows no week. On a phone the
note sits beside the name when it fits and wraps under it when not, so it never shrinks to an ellipsis; the row stays
36px. Every player row prints it but the Stats board's under a thumb. The squad row also puts FPL's expected day under the name, *Back 28 Nov*
(`returnDate`), beside it on a desk, the note itself never printing a date (Craig, 23 Oct 2026: *"theres an expected
date too … wheres that gone"*).

**CM's mark, not the box, beside every man who is not fit** (Craig, 21 Oct 2026: *"Use a yellow and Red Cross when
injured/doubt to match row. Red card for suspension"*). `StateMark` draws the cross for a knock, a card for a ban and a
barred circle for a man who has left, filled in his doubt band so it matches the row's wash (DESIGN §3); the word moves,
in full ("Doubtful", not "Dbt"), to its label and title. Every man whose `availabilityOf` is not fit gets one, so no row carries the wash alone. On the
planner, a fit starter it names under "Might not start" prints a quiet **MNS** (hidden from a screen reader, which hears "Might not start") in the same
place; the status mark outranks it, so a row never carries both. Off the planner nobody is named, as the rule needs
the legal moves only the planner holds. The row stays 36 under a thumb.

### The pitch

*Superseded 21 Sep 2026: every pitch now stands on `CmGround`'s flat diagram, and
`PitchFrame` and `PitchTurf` are gone. Kept as the record of the perspective pitch.*

- Full-bleed: it breaks out of the page gutters, because it is the widest thing
  in the app and the only one that gains from every pixel.
- Sponsor hoardings the width of the **far touchline** — not the page — carrying
  the league crest twice with the goal between them. They stand behind that goal
  line, so they are as wide as the pitch is at that depth; running them full
  width would put advertising on ground the perspective says is off the pitch.
  **That band is where a real sponsor goes.**
- Grass in perspective: a gentle splay (90% of the width at the goal line) as
  **one straight taper over the whole depth**. It was 78%, which is steeper than
  FPL's own app and cost the back line a fifth of its width — and the row padding
  is one figure for the whole column, so at that angle either the near rows gave
  up width they had or the far row stood off the pitch. It stood off the pitch.
  The inset is now the single number `FAR_INSET`, handed to the stylesheet by
  `PitchFrame`, and the row padding *is* that inset: every line stands inside the
  touchlines and none gives up a pixel to a line further back.

  An earlier version stopped splaying at 38% and ran square from there, which
  draws a touchline heading outward and then stopping dead halfway down — an eye still following the line
  reads the stop as the pitch turning back in. A perspective line has to keep
  going until it leaves the frame. Markings are at true proportions drawn at half
  scale, and drawn wider and shallower than true (`BOX_STRETCH`, `BOX_FLATTEN`):
  correctly proportioned at this scale the boxes come out as deep narrow slots,
  right on paper and wrong in a picture whose depth is already foreshortened.
  Penalty area, six-yard box, D, spot, corner arcs, halfway line, centre circle.
  **The touchlines are inset from the grass, not drawn on its edge** — there is
  always grass beyond a touchline, and a line on the edge of the picture reads as
  a border around a pitch rather than a line painted on one. They run off the
  near edge without closing, because that edge is a crop and not the end of a
  pitch.
- **The pitch has no ground of its own.** What lies outside the taper is the page
  background, as it is on FPL's. A second, darker green out there reads as a
  second surface, and the pitch stops being a thing sitting on the page and
  becomes a panel with a border.
- **All fifteen, no bench, no active/reserve mark.** A bench is a statement about
  who starts and this view may not make one. (The `TeamSheet` that renders once
  the gate is open does have one — the split is public by then, and it is the
  shape a reader came for.)
- Grouped by the position **the manager has him filling** (`slot.position`),
  never by what he is eligible for — Fantrax players routinely hold two.
- Sorted **by name within each line**, and that is load-bearing, not tidy. See
  the constraint below.
- Each player's bottom band **is** the fixture until he kicks off: the FDR colour
  fills the row edge to edge rather than sitting on it as a badge, and a double
  gameweek splits the row in two. Once he is on, the band flips dark and carries
  what he is worth — his points where we have a table, his minutes where we do
  not — with his goal/assist chips beside it. See
  [matchup.md](matchup.md#the-points-band).
- **One name size on every card, truncating.** It stepped down in three bands by
  length so a long name survived whole; that kept the words and lost the line —
  eleven cards in three type sizes read as eleven components, and the two men
  whose names had shrunk were the ones you could no longer scan. Craig's call,
  22 Aug, reversing the earlier one.
- **And the card shrinks, not the type.** That one size is `--text-2xs`, 11px, a
  declared step — the figure and the fixture under it are `--text-xs` (the fixture
  was `--text-3xs` until 30 Sep 2026, cream on the page ground at 15.5:1 and still
  unreadable at arm's length at 9px), and the chips are `--text-3xs`. It used to be `clamp(7px, 13cqw, 11px)`, a share of the
  card, which is the inversion that made this screen Craig's least favourite in
  the app: a line of seven took its width out of the name and printed it at seven
  pixels. Nothing in the clamp was reachable — an 11px name needed an 84.6px card
  and `MAX_CARD` was 69.6px — so the "range" only ever expressed its floor. Now a
  line too crowded to hold a name truncates it instead. There is no smaller thing
  to fall back to: FPL's `squad_number` is present on all 622 elements and null on
  every one of them, so the plate cannot print a number and does not pretend to.
- **Every card is the same width, on every line.** The basis comes from the
  fullest line in the set, so a back five and a front two draw the same card and
  a shorter line simply centres in the space. `MAX_CARD` is 110px, which is the
  width of the Premier League's own portrait file: the point at which a wider
  card would upscale the picture it exists to show. It was 4.35rem, which pinned
  every screen from about 768px up at 69.6px and a 9px name — so the desktop
  pitch was cap-starved where the phone is width-starved.
- **The KIT is drawn at the shape of the CROPPED kit** — very nearly square — **up to the
  height one row has room for**. Not the file's 110×145, and not the jersey's own
  shape either: counted off the alpha channel on 10 Sep 2026, the shirt inside
  the 220×290 canvas is 193×284 for an outfield kit and 207×283 for a keeper's,
  which is **0.680** wide-to-tall against about 0.88 on the sites Craig put
  beside it. Ours is a photographed full-length jersey and theirs is a stubbier
  illustration, so the hem is cropped — `KEPT` in `PlayerShirt`, with the card's
  shape computed from it (`CARD = JERSEY / KEPT`) rather than written out
  anywhere. It was 0.80 for one round and is 0.70 now (Craig, 10 Sep 2026: *"the
  shirts still seem long, so we could kinda cut them off to make them more
  square"*). The box was `1.32`, wider than it
  stood, which threw away three fifths of every asset and left a 33px face on a
  phone while a quarter of the screen under the pitch went unused.

  Since 10 Sep 2026 the shape is set by `PlayerShirt` on its own root rather than
  by each card, because every pitch now draws the same asset and a caller that
  forgot to declare it letterboxed a portrait kit inside `1.32`'s landscape
  default — 63px of shirt in a 110px card. The variable is set on the element
  that reads it, which is the only arrangement in which no caller can get it
  wrong.

  The card's height cap and its aspect-ratio can still disagree on a short
  viewport, so the kit shares an INNER box that takes the
  card's height and derives its width from the ratio. That box is the shirt, so
  the crop stays a crop at every viewport instead of quietly becoming a
  letterbox.
- **The card is bounded in both directions, and they come from opposite ends of
  the squad.** Width is a share of the fullest LINE, so a crowded line makes a
  narrow card. Height is a share of the screen divided by the number of ROWS,
  because that is what the pitch has to fit into — `.pitch-figure` in
  `pitch.css`, against `--pitch-page`. Height had no bound at first and the
  omission bit immediately: card width is `f(widestLine)`, so *fewer* men in a
  line make a *wider* card, and once the figure carries an upright shape a wider
  card is a taller one. The 1-3-4-3 XI — four to a line, the slackest squad in
  the league — drew the tallest card of any of them and pushed this page 199px
  past the screen, while the seven-across squad that looks like the hard case sat
  comfortably inside it.
- **Two budgets, because this route is two pages.** The gated view spends 232px
  on furniture; the same route showing the owner's XI spends 382, because it
  carries a bench strip and a way out to Fantrax. Held to one number the
  fifteen-man pitch — the one this card was rebuilt for — gave up a third of its
  photograph to pay for a page it is not on, so `TeamSheet` and `LineupPitch`
  carry `.pitch-with-bench` and the gated pitch keeps the base.
- **Below `lg` a pitch with a bench fills the screen** (Craig, 11 Oct 2026: *"better use of space?"*, over 145px of
  empty ground between a head-to-head's bench and the rail). `.pitch-with-bench` is a size container as tall as
  `--pitch-screen` less its page's chrome (`--pitch-page` there is the chrome alone: the head-to-head's, a double
  header's, the planner's `pitch-own`, a rival's `pitch-squad`, a match line-up's `pitch-match`), the grass takes what the strip leaves, and each card
  sizes off the sheet's `100cqh`, so the bench ends 16px above the rail at every phone in Chrome and WebKit. A line
  stretches to its tallest card, which lets a name with a space or hyphen take a second line on its plate
  (`pitch-name-breaks`): across the ten sides at 393 the cut plates went from 18 to 11, the rest single words.
  `--pitch-screen` subtracts `--safe-top` as well, or the installed app's planner bench ran 46px under the rail.
- **The PITCH fits a 390×844 phone with no scrolling** — that is the invariant,
  and it was "the page fits" until the season grid landed under the board on 31
  Aug 2026. The page scrolls now, deliberately: the pitch ends at 553px on a 390
  phone and the second panel starts at 565, so a reader sees the whole squad and
  the head of the grid before touching anything. What must not happen is the
  pitch running past the fold. Keep it that way, and **measure the
  XI view as well as the gated one** — it is both the tighter page and the more
  visited, and it is the one a change breaks first. Measured 29 Aug, all four
  rehearsal squads, signed in: every one draws inside 844. The gated
  seven-across pitch takes 468px and the six-across ones 512px, with 144px and
  100px of the screen still in hand; the XI takes 428px with 53px in hand.
  That headroom is the margin against the next band somebody adds above the
  pitch — one appeared mid-change and cost 44px of it.
- **`node tools/ui/pitchfit.mjs` is how this is checked, and typing the answer
  in here is how it went wrong.** Every number in this bullet was written by hand
  on 29 and 31 Aug and every one of them was stale within a day — the rail, the
  re-decided `--pitch-page` and a formation line above the grass each moved them.
  The instrument walks every squad the served league has at 390, 768, 1024 and
  1440 and prints where the grass ends against the fold; it exits non-zero if any
  of them runs past it. The figures above (232/382 of furniture, 468/512/428 of
  pitch, 53px in hand) are August's, are superseded, and are kept only because
  they are what a dated record is for. On 31 Aug the tightest of sixteen readings
  was **100px clear**, at 768.

### The list

One line per player: crest, name, club, then either his FDR fixture chip or —
once he is on — what he has done and his minutes, and Fantrax's fantasy points. Headings spell the position out — "Goalkeepers", not "G" — which is a
**documented exception** to never translating Fantrax's vocabulary, because
`getLeagueInfo` publishes the letters and no long names at all. A letter the map
has never seen prints verbatim, so the rule survives where it matters. The points
column heading reads **"Proj"** rather than "FPts" when Fantrax answered with a
projection — which it does unless the year-to-date code is both known and
honoured. The column vanishes entirely when Fantrax would not answer; it never
fills with noughts.

### The card

A native `<dialog>`, so Escape, the focus trap and the inert background are the
browser's. Its subject is the same sticker at album size — tapping a sticker to
be shown a plainer portrait would look like a different player. Carries the
fixture and kickoff, FPL's fitness note when there is one, why a slot is
unresolved when it is, and a way out to the full profile.

## LineupPlanner — your own team

- **The XI on the pitch, the bench in a strip beneath it.** A rival's squad puts
  all fifteen on the grass because the active/reserve split is withheld there. On
  your own team that split is the decision being made, so it is the thing you are
  looking at.
- **One toolbar, a rival's** (21 Oct 2026): the planner draws through `ListAndPitch`, so the Pitch/List toggle,
  the pending figure and the week share one row, and list and pitch one flush panel, exactly as on a sheet. It
  still opens on the pitch; `?view=list` or `?view=pitch` opens a phone on that reading, on the planner and any
  sheet alike (`pitchListOf`, shared with a club's squad). **No lock plate** (Craig: *"it hogs the page"*): the "Locks Sat 12:15" row it carried
  from 16 Oct is gone, and the lock prints on Matchday and the schedule. A note from a tap on a dimmed card shows
  on a plate above the toolbar until the next tap; silent, it is out of the flow.
- **Its kits load at once** (`eager`, 16 Oct 2026): the 14 lazy kits put this pitch's largest paint at 4.2 s on a
  throttled phone against about 2 s for the other key screens. Every other pitch stays lazy, because a phone keeps
  the head-to-head's desk pair and a rival's list-first pitch in the page hidden, and eager kits there are fetched
  for nothing. Still `unoptimized` (PLATFORM_NOTES, 5 Oct).
- **One target per player, and a second tap puts him back down** (Craig, 6 Oct 2026: "click that player again.
  expected - cancels the selection"). Tap him once to pick him: he takes an accent ring and everyone he cannot
  legally change places with goes dim, so "who can come off for him" is the set still lit rather than a list to
  read. The second tap used to open a move dialog listing the same swaps; it is gone, and with it the one move
  the pitch cannot draw, a starter off to the bench with nobody coming on. His player card is the list's tap.
  **A tap on a dimmed card says why in one line** above the pitch, on a plate and announced as a status
  (`whyBlocked`, 16 Oct 2026): the floor the man going off would break ("The XI needs at least 3 DEF."), the cap the
  man coming on would pass, or that two starters do not swap. The cards are `aria-disabled`, not `disabled`, so the
  tap lands; the next tap clears it.
- **A free place is an empty box on the grass** (Craig, 5 Oct 2026: "say i have a 3-4-3, and i want to put a
  forward (hes m/f) to mid, then there should be on the pitch view an empty box"). Picking a man draws a dashed
  box at the end of each line he can move into with nobody coming off, and a tap on it moves him there. That line
  then holds one more, so every card narrows while he is picked; the pitch is sized by its fullest line.
- **Every rule is the commissioner's**, read from `getLeagueInfo` and applied by
  `moves.ts` in core: how many may start, how many may sit, the cap at each
  position, and which positions each player is eligible for. Nothing about the
  shape is assumed — a 1-5-2-3 is legal in this league and would be legal on
  screen.
- **Save line-up writes it to Fantrax** (Craig, 30 Sep 2026: "needs a save button ... make the save button
  obvious, and a 'do you want to save' if you leave the screen"). The royal-blue primary plate, with Reset beside
  it, is the planner's footer: docked above the thumb rail on a phone and at the window's foot on a desk, always
  in view, and greyed until the lineup differs from Fantrax's or while a rule is broken (Craig, 6 Oct 2026: "save
  your lineup button should just be greyed out when no changes, and it should act as a footer"). `saveLineup`
  (`squad/[teamId]/save.ts`) names the team from the signed code (never the lent demo team) and the week from
  `planningRound()`, refuses a page planned for another week and anything inside `SAVE_MARGIN_MINUTES` of the
  lock, re-checks the league's rules, then sends Fantrax's dry run and saves only on a clean `CONFIRM`. It runs
  only for a team `LINEUP_SAVE` allows (`on`, or a list of team ids) with `FANTRAX_COOKIE` set; elsewhere the bar reads
  "Planned, not saved" and the Fantrax link is the way to submit. Each write logs one `lineup-save` line: who moved,
  from and to (`lineupChanges`), the bench order sent or null, and Fantrax's words when it refuses.
- **The bench order is yours to set on the pitch.** Tap one sub, then another, and they swap places; the
  numbers 1–4 are the order they come on. It starts from Fantrax's `autoSubOrderMap` and saves with
  `setAutoSubsOrder`. A swap's starter coming off takes the bench place of the man going on (`orderAfter`): sent to
  the end, Ndoye for Foden put Minteh (INJ) up to second (16 Oct 2026). A save sends that order with the lineup.
  Fantrax's order is read through the open period's 30-second cache (`benchRanks` in `benchOrders.ts`), the one a
  rival's open sheet reads, and a save marks it stale with the squads: read uncached, it was a Fantrax request on
  every view and every poll, 143–254 ms against 12–120 for a rival's squad.
- **Leaving with unsaved changes asks first**: "Save your lineup?" with "Save and leave", "Leave without saving" or
  "Stay" on a tap to another screen where saving is on, and "Leave your plan?" with "Leave" or "Stay" where it is off
  (nine of ten teams since swap day, 16 Oct 2026); focus starts on Stay. The browser's own prompt covers a reload or
  close. The back button is not caught: a guard history entry would leave a dead Back press behind after every
  Reset or save, since it holds the same URL, and Next's router restores that entry rather than ignoring it.
- `violations()` reports what is already wrong — nothing the planner offers can create any of it, so anything
  listed arrived from Fantrax, usually a commissioner narrowing an eligibility under a lineup that was legal
  when it was set.
- **"Might not start: Sarr, Kudus, Osula"** under the planner, in the doubt red (Craig, 19 Oct 2026: *"i like
  like"*, to a GW8 eleven starting Sarr on 34 xMins, Kudus 46 and Osula 48 with a bench at 81, 73 and 71, figures
  only the List showed). A starter is named when his xMins for the planned week are under `START_DOUBT_MINUTES`
  (50) and a sub who could legally swap in for him (`legalMoves`) is clearly above: at 50 or more, and more than
  the scout's bar (`XMINS_MOVE`, 10) over him (`mightNotStart`). No xMins code had a floor before; 50 is just
  over half a match, and catches all three of Craig's men and none of his bench. A man with no reading is never
  named, and the line never says who would come on: football has no depth chart. The planner opens only on the
  open week, so a locked week never carries it.

## Constraints

- **Ordering within a line must stay alphabetical.** Ordering by anything the
  roster carries restates the XI as an ordering. Fantrax happens to interleave
  actives and reserves in its payload, so rendering their order happens not to
  leak today — that is their serialisation detail, not a promise.
  `squadUnarranged()` sorts by name to make the non-leak a property of our code.
- No active/reserve treatment of any kind in this view: not a badge, not an
  opacity, not a position on the pitch.
- The planner is gated on `mine`, on the gate being open, and on `getLeagueInfo`
  having answered — one value (`planning`), so there is no arrangement of the
  three that opens a planner with no rules to enforce. It is **not** gated on the
  league being the rehearsal one any more: that check existed only to guard the
  `?preview=1` escape hatch, which existed only because the gate used to withhold
  your own lineup from you. The rule is narrower now — your own team always, every
  other team once its period opens — so there is nothing left to switch off.

## The five tabs — a team is a spine, not a page

Added 2 Sep 2026. `cm9900/25.jpg` runs `Squad · Transfers · Next Match ·
Fixtures · Finances & Info` across the top of Everton and `cm0102/07.jpg` runs
the identical set two releases later, so this is the reference's own shape
rather than one invented here. Ours drops the finances, which a fantasy team
does not have, and spends the slot on Stats.

`squad/[teamId]/Shell.tsx` is the frame all five wear: the team's title bar in
his own colour and the strip, and on a rival's team a phone's `←` back plate at
the bar's left (never on your own, which has its tab). Your own team's bar is off a phone's screen, its room going to
the pitch, but kept as `sr-only` rather than `hidden`: it holds the page's h1 (review M64). No caption box since 23 Sep 2026: it repeated the
lit tab. It also sets `--cm-index` once, so
every index block on every tab runs in that manager's colour rather than the
league's deep blue.

**The League strip is not replaced, because it was never here.** `/squad` has
never rendered `SectionNav`; the rail is the only thing that has ever marked
this section, and it goes on doing it — `owns()` prefix-matches `/squad/`.

| Tab | Route | What it is | Where the data comes from |
|---|---|---|---|
| Squad | `/squad/[teamId]` | The list and the pitch, side by side on the desk | the rosters read this page already makes |
| Transfers | `…/transfers` | His business, as `cm0102/23.jpg`'s ledger: one row a deal, a With column only once he has traded; under a thumb a day heading over each day's deals and the type beside In (`groupByDay`, 20 Oct 2026); on his own team, the waiver line over it all week (`league-waivers.md`, 19 Oct 2026) | `readDeals`, filtered to him — the same feed the paper's business column reads |
| Match | `…/next` | Who he plays, both sides on their own colours (`21.jpg`); the whole plate opens that tie's head-to-head at the gameweek (19 Oct 2026). Under it both line-ups for the planning gameweek, as the head-to-head lists them before kickoff: a rival's eleven once his period opens, his squad unarranged before (`teamDisplay`); a phone shows one side, picked from two plates in the foot (`?side=opponent`), the desk both side by side; each shown side is its `teamSheet`, so the bench is Fantrax's numbered order as on Squad (30 Oct 2026, review round 5 A1; Craig, 20 Oct 2026: the tab stays and earns its place) | `headToHeads` and the rosters, already on the page; two ties for a double header, each its plate and its two sides |
| Fixtures | `…/fixtures` | The whole season: to come first with the current gameweek on the accent edge, then the played under one "Played" row, newest first; a cup named only on its own row on a phone, a league row bare, a gameweek to come a faint dash (21 Oct 2026) | `seasonRows` + `seasonOrder` + `Season`, imported from `/league/schedule` rather than copied |
| Stats | `…/stats` | Every man he owns, filtered by category | `getPlayerStats` filtered on `ownerTeamId`, off a warm cache; the stats league's season beneath each group (`statsLeague.ts`); DefCon points of ours on Scoring, off its periods |

**Three of the four cost no new request.** That is why they are tabs and not a
later phase: the reads were already being made and were being thrown away.

**A tab with nothing behind it greys and stays put** (`.cm-out`, its first
consumer after three sightings in the reference). `cm0102/07.jpg` greys an
unavailable `Training` rather than hiding it: a strip that loses a plate has
moved every plate after it, and a reader who tapped Transfers yesterday would
find Fixtures where it was.

**Which round a tab shows.** Your own squad opens on the PLANNING round, because a planner is about the week
you can still change. **A rival's opens on the next gameweek too** (Craig, 16 Oct 2026), overruling the last
LOCKED round it opened on from 2 Sep: on a Friday that drew GW6's fourteen for Raccoons, four of them released
since and one on the free-agent list at the same moment, while his Stats tab listed the men who replaced them.
The gate still holds: before that week locks, the next gameweek draws his squad as a list, never his eleven.
The one exception is the week in play: while the locked week's football is still to finish (`rivalWeek`, off
`roundState`), a rival opens on it, so a Saturday shows his eleven and its points. `?gw=` still wins over both.

## Known gaps

- ~~**Your own squad has no list view, ever.**~~ Overruled by Craig, 2 Sep 2026:
  "my squad will have list view, change, old rule". The reasoning that stood
  behind it — the planner's subject is the arrangement, which a list cannot
  express — was an argument for the pitch, never against a list *beside* it, and
  it quietly conceded its own cost in the next sentence: the one squad you look
  at most was the one you could not read as rows. The desk has the width for
  both (19.jpg), so at `lg` the planner keeps the left and a squad list takes
  the right. The phone still gets the planner alone.

  What does not change with it: the active/reserve rules above are product
  invariants, not properties of the pitch. A list rendered beside a gated view
  inherits nothing by being adjacent — it is gated on its own.
- ~~**Future gameweeks are not browsable.**~~ `?gw=` works since 22 Aug, resolved
  through the calendar seam exactly as the head-to-head route resolves it, and
  the schedule's rows link into it — so tapping a side in a March fixture opens
  March's fifteen rather than this week's. The lineup gate still applies: a round
  whose period has not opened shows the squad and not the arrangement.
- ~~A line of seven leaves those names at the smallest step the plate allows.~~
  Solved 29 Aug, and not by wrapping — Craig was offered balanced rows and
  rejected them, so the recorded shrink-not-wrap rule stands. The line still
  gives up width; the type does not go with it any more. At seven across on a
  390px phone the card is 43.3px and the name is 11px, truncating; at seven
  across on a desk it is 110px and most names fit whole. Seven is still an
  autodrafted squad rather than anything a manager would pick, and it is now
  legible either way.
