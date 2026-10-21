# `/players` — Data

Every player Fantrax knows, what our league has decided about him, and what
Fantrax scores him. **It is its own section as of 6 Sep 2026** (Craig: *"I think
this function will be its own section away from the league etc"*), wearing
`players/Shell` rather than `LeagueShell`.

The URL did not move. A URL is persisted the moment somebody shares it, and the
route is the same route — only its frame and its place in the app changed.

## The section

- **"Data", the fantasy deep dive, since 24 Sep 2026** (Craig: *"FIND is now DATA"*). It was CM's
  **"Find"** from 10 Sep (the rail in `cm9900/12.jpg` reads `… Competitions · Nations & Clubs · Find`), and
  **"Scout"** before that. The URL stays `/players`, and `titles.ts` keeps the constant's name `SCOUT`.
- ~~**The royal-blue bar, not the cream competition plate.**~~ *Superseded 20 Oct 2026: Data draws no bar.* Its
  strip names the view and the rail's lit Data plate the section, so the bar said "Data" a third time; the page
  keeps an sr-only `h1`, as Mail. The record: `PageHeader` draws two
  and which one a screen gets says what KIND of thing it is about (`cm9900/24.jpg`
  is a competition, `25.jpg` a club or a person). The cream plate is spoken for
  by `/league` and `/prem`; Data is not a competition, it is the activity, so it
  takes the bar every other subject-without-a-colour takes.
- **On the phone's bar, last** (Craig, 24 Sep 2026: *"data needs to be at the bottom"*), after Prem.
  It sat behind `More` until then. DESIGN §2 carries the bar and its ceiling of six.
- **Its views**: Players · Adv Stats · Compare · Clubs · Planner (Projections while shown), on `players/PoolNav`
  (Craig's labels, 24 Sep 2026; Adv Stats and Clubs, 16 Oct 2026; Overview and Analysis until 24 Sep, and the keys
  `pool`, `analysis` and `teams` did not change). Five plates sit at 11px from 375 up, each sized to its word, `Adv
  Stats` on one line; under 375 a `word` strip drops to 9px. Measured at 320, 360 and 390, 16 Oct 2026.

## Two boards, the bin and the row (16 Oct 2026) — current

Craig, 16 Oct 2026: *"compare data section on our app, mob and desktop, with fantraxs players section. ours is bad,
feels hard to find data, fantrax much easier to just pick which, for example, forwards are in the bin"*, and *"Maybe
it's worth the first page just being all the fantasy stats, then another section for literally all the other stats
we have."* His calls on the review the same day: Players opens on FREE and search still covers everyone (yes); the
second view is "Adv Stats"; Teams → Clubs (OK); no count line above the board (no: the sheet's button carries it).
Where a section below disagrees with this one, this one is current.

- **Players (`/players`) carries the fantasy figures only**: the categories the league scores, as getLeagueInfo
  gives them and never a list, plus FPts, FP/G, GP and DCP. Each count names its Fantrax category
  (`PoolColumn.scores`) and `views.ts` keeps it where `firstScored` finds the league scoring it; the four are
  `fantasy`. In the real league that is `FPts FP/G Min GP G AT CS DC DC+ DCP GA GKP PKS YC RC PKM OG`, which fits
  a 1440 desk (1100 of 1100) and a 1280 (1098 of 1098), where 27 heads had run 38px past both. A league whose scoring
  did not arrive keeps every count here. Players has no stat plates and no Per 90.
- **A position chip draws only what that position scores** (`paidFor` in `columns.ts` over core's `paidAt`, Craig
  21 Oct 2026): a count is drawn under the pressed chips when the league's own `getLeagueInfo` price is above nought
  for one of them, so in the real league `GK` drops `DC DC+ DCP`, `DEF` drops `DC+ GKP PKS`, `MID` and `FWD` drop
  `DC GA GKP PKS`, and `FWD` drops `CS` (priced 0). Several chips draw the union; no chip draws every column, as
  before. `DCP` follows `DC` and `DC+`; a figure no category prices (FPts, FP/G, GP) is drawn under every chip, a price
  that cannot be read keeps its column, and the sorted column stays. The Key lists what is drawn, and **Sort by offers
  the same** (`sortOptions.offeredFor`, Craig 21 Oct 2026): no column a chip hides, the sorted one kept.
- **Players rests on the free men** (`boardChange.statusesShown`): an absent `status` is FA and WW, and `status=all`
  is everyone, the only way the address bar can say it now. A typed search ignores the resting choice and looks
  through everyone, so "who holds Saka" finds him, as Fantrax's does; a status the reader pressed still applies.
  Reset returns to the resting board; the way off an emptied board (*Clear filters*, *Search all players*) shows
  everyone. Both boards rest the same way, so a query means the same on either. The Clubs and Planner rows land on it
  too: the free men at that club.
- **The row under a thumb is two fixed lines**: the search and Filter, then `GK DEF MID FWD` and `Free Owned`
  (4 × 44 + 50 + 57 and gaps: it fits 346 at 390 and 316 at 360; at 320 the status pair takes a third line). Nothing
  on it moves when pressed, so the 16 Oct "row jumps 50px" is gone. **On a desk it is one row**: search, positions,
  Free and Owned, Per 90 from `xl`, and Filter at the end (`Key` before it, on both boards). Adv Stats' plates dock at the
  screen's foot since 20 Oct 2026 (below).
- **Position is on the row at every width** as grey plates, a union as before, and left the sheet: nothing is in two
  visible places. *Forwards in the bin* is **one tap** (FWD) at 390, from five (FA, WW, Filter, FWD, Show); Fantrax's
  is one.
- **`Free` is one chip for FA and WW; `Owned` stays.** A row chip shows its own men alone, so Owned on the free board
  shows the owned in one tap, and a lit chip lets its men go (pressing the lit Free shows everyone). **FA and WW alone sit
  in the sheet's Status** at every width, each on or off on its own; the sheet drops the block when the pool carries
  only one of them, which Free already is.
- **The tick sits in the plate's corner** (`Chip`), so a press never changes a chip's width; the Filter badge keeps
  a slot of its own at nought, so Filter never moves either. The badge counts what the sheet holds that is on: the
  club, a lone half of the bin, and on Adv Stats below `xl`, Per 90 (its plate too until 19 Oct 2026). Per 90
  stands down on a plate where no drawn column divides by minutes, as Attributes unless a rated column is sorted
  (`ratedOn` in `columns.ts`, 20 Oct 2026): there `?per=90` neither lights the toggle nor counts on the badge.
- **Clubs** is the label of `/players/teams` (teams.md); its key and route stay `teams`. Its goals conceded are
  headed `GA`, as on Adv Stats (21 Oct 2026); its `Tk` and `BC` are different counts from Adv Stats' `Tkl` and `BCM`.

### Adv Stats: Attack, Creating, Defence and a key (19 Oct 2026) — current

Craig, 19 Oct 2026: *"data section, adv stats needs more things like xg, touches in box etc, and split into
attack/defending, and a glossary, need to think about mobile"*. Where the 16 Oct section below disagrees, this one is
current. It reverses *"they don't need a glossary"* (`docs/rules/PRODUCT.md`, Users) for this board.

- **Plates, no `All`**: `Attack · Creating · Defence · Attributes` (`groups.POOL_GROUPS`), resting on Attack. Each
  plate orders the board by its own column and clears the reader's sort, so a plate always opens on its own order:
  Attack by `xG`, Creating by `xA`, Defence by `Tkl`, Attributes by `Acc`, its first rating.
  `?group=all` and any group the board lacks land on Attack. Sort by in the sheet still reaches every plate's columns (less any a
  position chip hides), and the sorted column is drawn under any plate.
- **Attack** `xG npxG xGI npxGI Sh SoT BCM`; **Creating** `xA KP BCC Crs AC`, with `AT A AF` first in a league that carries them
  unscored; **Defence** `Tkl Int Blk Clr Rec AW xGC`, with `Sv` last where carried unscored (`seasonColumns.ts`).
  Seven, five and seven figures at 390 in the real league (Attack five until npxG, 21 Oct 2026), where `All` drew seven of seven at 390 before (counted off the
  columns; the lead measures the shot). `Blk` is the stats league's DefCon count less tackles won and interceptions
  (`core:blocks`; DFP3 is DFP + Clr + Rec on 445 of 445 rows, 19 Oct 2026). `DFP` is the league's own DefCon count,
  tackles won + interceptions + blocks (282/282 against Opta, 6 Oct), not the CBIT/CBIRT of the other game; the
  difference equals that game's clearances-blocks-interceptions less the same Clr and Int on 420 of 420 men, and runs
  0.65 a 90 for defenders, 0.24 midfielders, 0.14 forwards (Gabriel 1.00, Tarkowski 0.86, Haaland 0.15). `xG xA xGI xGC` are the football
  snapshot's season figures, which have no league twin to disagree with; a man with no minutes dashes, and Per 90
  divides them by the same snapshot's minutes.
- **`npxG` and `npxGI`** (Craig, 21 Oct 2026: "Need npxg and npxa per 90 too"): FPL's xG less the xg of his shots
  the shot file marks `situation: "penalty"` (`core:nonPenaltyXg`), and that plus xA. The shot file's xG is the
  same model as FPL's: 11/11 penalty fixtures matched FPL's per-match xG to 0.01 with the penalty in (each 0.7884),
  and the season's sums differ by a median 0.001 over 329/329 men with shots, 21 Oct 2026. No `npxA`: xA values
  the pass, a penalty has none, and all 11 penalty shots carry no assister, so it would repeat `xA`. A man with xG
  and no shot in the file, or a penalty with no xg, dashes both; a man who took none reads his xG.
- **The plates dock at the screen's foot** (M-CONSIST-1, 20 Oct 2026, the 24 Sep rule: a screen's sub-views switch
  from its foot): `FootFrame`, above the thumb rail on a phone and at the screen's foot on a desk, on the main strip's
  label ladder (`TabStrip`'s `word` plates, 3xs under 375), so the four hold one row at 320 where they wrapped to 94px.
  They were a third line under positions (inline from `xl`) from 19 Oct 2026, one tap from any plate to the next where
  the sheet took three. They left the sheet, so nothing is in two places, and the Filter
  badge below `xl` counts Per 90 alone, and not on a plate where it stands down (`ratedOn`). The four end at 309 of 338 at 360 with Chances (UX review, 19 Oct 2026), so
  Creating, a capital longer, holds one line there too.
- **`Key` sits beside Filter** (`players/ColumnKey`, the house dialog, Back shuts it): every head on the plate,
  its name and one line on what it counts, in plain words and never a source. Players has it there too since
  21 Oct 2026 (Craig), reversing 19 Oct's "Players keeps its `Key` under the board": seven of its 17 heads do not read
  cold, and under the board it sat ~1,450px down past "Show 30 more". Every line is one shape, "Title. What it counts." (attributes "Acceleration. 1–20, from sprints per 90, this
  season."); an expected figure's head keeps its lower-case x (`TableHeads.headWord`), as the Key prints it.
- **Not held, so not drawn**: touches in the box (Opta's per-man match read has it, one request per man per match;
  a season total is one request per man, a new cron; the touch cloud's box count ran 25 to 60% over Opta's on three
  men, 19 Oct 2026), successful dribbles (the stats league holds take-ons tried, not won). ~~npxG (the shot file's
  xG is another model's)~~: it is FPL's own, counted 21 Oct 2026, so npxG is drawn (above).

### Adv Stats (16 Oct 2026)

*Plates, sort and the key superseded 19 Oct 2026 (above).*

`/players/stats`, second on the strip: the same pool, rows, row of controls and resting free men as Players, under
every figure Players does not draw.

- **Its columns**: the stats league's season counts (`Sh SoT KP BCC BCM Crs AC`, below), any count the league's read
  carries but the league does not score (`A`, `AF`, `Sv` in a league that carries them), and the attribute grid.
  ~~Shots first and the default order (`STATS_SORT`)~~ (xG since 19 Oct); a `?sort=` it does not draw falls to its
  plate's order, as one Players does not draw falls to FPts.
- ~~**Its plates are the ones its columns fill** (`groups.platesFor`): `All`, then each group with a column in it, less
  a lone group of counts that would only repeat `All`. Today that is `All · Attributes`.~~ **Per 90 lives here only.**
  From `xl` it sits on the row; below it, in the sheet. **Under Per 90 each divided head carries `/90`** (`xG/90`),
  in the Key too (`headedFor` in `columns.ts`, 21 Oct 2026), since 0.82 could be a season's total; `Min`, `GP`,
  `FP/G` and the ratings never divide and stay bare.
- The quiet "Season to …" line follows the board here, under a plate drawing the daily file's counts.

## The board as redesigned, 24 Sep 2026

Designed first (a design round, then a fresh mobile review), picked by Craig: option B, revised as R. His notes
on the phone: *"remove the yellow title for space"*, *"Mobile needs more room for columns"*, *"remove the
position title on the left here. Put position elsewhere"*, *"Remove opponent as well"*, *"Tighten the column
headers too?"*. Where the sections below disagree with this one, this one is current; where the 16 Oct section
above does, that one is.

- **Phone-first order** (*split on 16 Oct 2026: Players draws the scored share, Adv Stats the rest, in this order*): `FPts FP/G Min GP G AT A AF Sh SoT KP BCC BCM Crs AC CS DC DC+ DCP GA Sv PKS YC RC PKM OG`
  (`Sh` to `AC` are the stats league's season, below; `Ros` and `+/-`, the share of every Fantrax league
  rostering him, went on 12 Oct 2026 under DESIGN §7). `DC` and `DC+`
  are the league's DefCon counts, Fantrax's `DFP` and `DFP3` (Craig, 6 Oct 2026: *"data page needs our dfp and dfp3
  stats"*); `DCP` is our DefCon points beside them, drawn only where the league prices DefCon (Craig, 8 Oct 2026), and
  **lit like any figure** since 21 Oct 2026 (*"DCP yes lose it"*): it lost the cyan, which on Players is `FPts` alone. **`FPts` prints in the same reading cyan and is never lit** (`PoolColumn.cyan`, Craig 21 Oct
  2026, as on the Profile since #80): it was lit on 13 of 13 rows of his FREE board. It still sorts and sums as
  Fantrax's count; only its ink changed. Six figures sit
  beside a name at 390 (FPts to AT), five at 360, since the lead widened for the name on 1 Oct 2026 (it was
  seven and six). **Opp is gone** at both widths; the next fixture is the planner's question.
- **Under a thumb each man is two lines** (Craig, 16 Oct 2026: *"Did you also see the side scrolling on Fantrax,
  much better"*): his crest, name, holder, position and CM's mark on a line held still at the board's left edge, and
  his figures across the full width under it, scrolling sideways with the head; the head row still sticks to the top
  of a long board. 13 of 18 figures show at 390 (6 beside a pinned 160px lead before), 11 at 360, and 8 men above the
  fold where 13 were. The desk keeps the one-line row below. Chrome and WebKit agree (measured 16 Oct 2026).
- **The lead** is pinned on a desk (`players/BoardRow`, shared with Projections): crest, then the name with **who holds
  him in brackets straight after it**, behind CM's mark for an unfit man (`FitnessMark`; the word box until 21 Oct
  2026, D-11) (Craig, 24 Sep 2026: *"put the manager in brackets right after the
  player to allow more room for columns"*). On a phone the name is initialled (`P. Groß`, `initialled` in
  core), in FPL's spelling wherever it is the same name as Fantrax's (`spelt`: Groß, João, O'Reilly, as every squad
  list prints them; 16 Oct 2026, review N30), and has line one to itself and CM's mark, and line two is the position (`MID`, in `LABEL` ink) with
  the holder after it (Craig, 1 Oct 2026: *"needs more space for player name on mobile"*); the lead is 160px,
  room for a fifteen-letter "Surname, I". On a desk the name is whole, CM's position tile
  runs down the left, green for a man on no roster (`--color-index-free`, Craig 1 Oct 2026), and the lead is 256px.
- **Who holds him** (`players/holder.ts`): `(Yours)` in the accent (the page reads the reader's team), a rival
  by the league's short name, quiet, with Fantrax's full name as its title (Craig, 6 Oct 2026: *"manager names
  need short manager names"*), and Fantrax's own `(FA)` / `(WW)` loud, because that is the man a reader can act
  on; the word is its title. This reverses 10 Sep's "owner loud, status quiet". A board filtered to one status
  drops that code (16 Oct 2026): "(WW)" on 100 of 100 rows of `?status=WW` said what the pressed chip says.
- **Heads** are the one 24px plate at both widths, with 2px padding under a thumb (`SortHead compact`), so a
  narrow column is as wide as its figures (21 Oct 2026).
- **A man's row under a thumb is one 36px target**: his name line is 20px and his figures 16 under it, and the
  name's link hangs over both (21 Oct 2026; 24 + 20 that morning, 44 + 19 before). The desk keeps one 28px row.
- **Figures** are centred, in ink. Standouts are lit in ink, never on a ground: orange for a column's best
  (a twentieth of the scored figures), yellow for the rest of its top sixth, red at the bad end
  (`components/league/standout.ts`, shared with the match board). A nought prints, quietly; an absence is `—`.
  Per-90 figures stay white (Craig).
- **No yellow caption** in Data at any width (the tab strip names the view). When `FPts` is Fantrax's
  projection, a warning prints above the board instead.
- **The filters are the house dialog** (`shell/Modal` through `players/FilterSheet`) below `lg` and an inline
  panel from `lg`, headed "Filter players" (*16 Oct 2026: Position moved to the row, the sheet's Status is FA and WW
  alone at every width, and the plates and Per 90 are Adv Stats' only; above*): Position as CM's index tiles (chosen: an accent edge and a tick, the word stays white), Status
  chips between `lg` and `xl` (the row carries them at every other width), Club and **Sort by** selects side by side (`QuerySelect`, one component for every Data
  select), the stat groups (docked at the screen's foot since 20 Oct 2026), Per 90, then Reset and `Show N`, pinned at the foot. A tap outside, Escape or the cross closes it.
  **Reset** turns everything off (search, sort and Show all with the filters) and shuts the sheet; only a comparison's
  `compare` stays, so a picker stays one. **`Show N` promises what the board draws**: `Show 100 of 145` while it
  draws a page (16 Oct 2026; no count line above the board, Craig's call), `Show 30 of 145` since 20 Oct. While the sheet is open every tap in it
  **replaces** the history entry, so one Back after Show returns to the board as it was before Filter.

## Shots, chances and crosses (9 Oct 2026)

*On Adv Stats since 16 Oct 2026*, not Players: the served league scores none of the seven.

Craig: *"We are missing a lot of stats like shots, chances created, maybe even big chances … Key passes, crosses
etc."* Seven columns follow `AF` under **Attacking** and on **All** (*split across Attack and Creating, 19 Oct 2026,
with Defence's six beside them*): `Sh` shots, `SoT` on target, `KP` (titled
"Chances created" until 19 Oct 2026, "Key passes" since, as its head says), `BCC` big chances created, `BCM` big chances missed, `Crs` crosses, `AC` accurate crosses
(`seasonColumns.ts`).

- **The stats league's season, not the served league's.** The served league scores none of the seven, so they come
  off `data/intel/stats/26-27.json` (`intelStats`, `npm run stats`, daily), joined by FPL code into the stats bag
  under their own keys. They carry no `stat`, so a league that lacks the column cannot drop them.
- **A quiet line under the board dates them** ("Sh to AC: season to Tue 6 Oct"): the file is daily, so a gameweek in
  play runs ahead of it while `G` and `AT` are live.
- **Per 90 divides by the file's own minutes**, never the served league's `Min`, which can be a match ahead.
- A man the file does not hold (no minutes, or no bridge) dashes on all seven. A keeper's half of the read carries
  only `KP` of them (24 keepers on 6 Oct), so his other six dash and his `KP` prints, nought or not. `BCM` is lit at
  the bad end, as `PKM` is.
- The address bar's keys are `sh sot kp bcc bcm cr ac`: `crs` is the attribute grid's Crossing.

## On the page — the Board

**As many columns as Fantrax shows** (Craig, 6 Sep 2026), and the same shape
Fantasy Football Scout's Stats Centre uses. What stood here until then was a
Championship Manager leaderboard of ONE measure with two rows of blue plates
above it to choose which — goals, then assists, then penalties missed, one at a
time. A sortable table shows all of them at once and answers the same question
with one tap instead of two.

Twenty-one columns in Fantrax's own order: `Player Pos Club Sta Opp FPts FP/G
GP Min G A AF CS GAO GA Sv PKS YC RC PKM OG` (`Ros` and `+/-` went on 12 Oct 2026). `columns.ts` is the table
and each column names the payload it reads.

*It was twenty-four until 10 Sep 2026, when Craig cut `Rk` — "remove the rank
number column".* It had stood down on a phone since 6 Sep on the same reasoning
carried one step further: the rows are in an order the reader chose, and Fantrax's
absolute ranking is a fact about a different competition. Nothing sorted by it —
`DEFAULT_SORT` has been `fpts` since 6 Sep — so it went without a trace.

- **Two payloads, no new reads.** The seven fantasy columns come off the plain
  `getPlayerStats`; the raw counts off the same endpoint asked by position group,
  which answers 18 columns for the outfield and 20 for keepers. Both halves were
  already being fetched to feed the board this replaced. `mapPlayerStats` drops
  the fantasy seven from its bag, so the two never overlap.
- **A keeper's blanks are absences, not noughts.** An outfielder has no `Sv`: the key is
  missing rather than nought and the cell dashes. Nought saves for Haaland is a statistic
  about a thing that cannot happen. Since 19/20 Oct 2026 a keeper's `GA` and an outfielder's
  `GAO` share one `GA` column (`PoolColumn.also`), so only an outfielder's `Sv` dashes.
- **Every row leads with a face on his club's colour.** The FPL code comes
  straight off the bridge rather than through a football snapshot: the code is
  all a portrait needs, and joining the whole football layer here would give a
  page that is otherwise entirely Fantrax's a second provider to fail on.
  Fantrax's club code is translated through `toFplClubCode` first — the two
  agree on eighteen clubs of twenty, and the other two would take the fallback
  grey on every row.
- **Sorting is a link, not a click handler.** The server orders, the phone gets
  HTML, and a sort survives being shared. The heads are
  `components/league/TableHeads`' — the shared bevelled plate, drawn PRESSED on
  the column in force (Craig, 6 Sep: *"where are the column headers using a grey
  box that can be selected"*). This screen rolled its own for one day and was the
  only sorting table in the app with no plate on any head.
- **`FPts` descending is the default**, which is Fantrax's own, and it is named
  in `columns.ts` rather than taken as the first entry so reordering the table
  cannot silently change what it sorts by.
- **`Rk` stands down under a thumb** (Craig, 6 Sep: *"for mobile ditch the rank
  column, wasted space"*) — **unless it is the column being sorted by**, because
  DESIGN §2 forbids hiding the sorted column: `display: none` takes the pressed
  plate, the arrow and `aria-sort` with it.
- **The name column is frozen** on a desk (under a thumb, the name line above), DESIGN §9's decision finally built. Capped under
  a thumb and uncapped on the desk: it is legible at any scroll position, and
  uncapped it took two thirds of a 390 screen and left three columns showing.
- **Nothing else is hidden on a phone.** The table scrolls sideways with CM's own
  bevelled bar. DESIGN §2's table-geometry rule is why this stands where the
  standings tables subtract: a directory has no last column that matters more
  than the rest.
- **No opponent column** (Craig, 24 Sep 2026: *"Remove opponent as well"*; `columns.test.ts` holds it). The next
  fixture is the planner's question, and the planner writes it as every fixture is written, `CHE (A)`.
- **Paged at `PAGE_ROWS`, thirty at every width** (Craig, 20 Oct 2026, M-SQUADS-1: a hundred two-line men ran eight
  phone screens, twelve at 320; the server never guesses the screen). A **`Show N more`** plate at the foot adds a
  page at a time, `?rows=60` and so on, and N is what it will draw, `min(30, left)` (`pageRows.nextStep`); "First 30
  of 145 · Show all" stays beside it as the escape. A step and Show all hold for a sort, a stat group or Per 90, which
  reorder or re-column the same rows; a filter, a search, a club or Reset drops both (16 Oct 2026: Show all had stuck
  to every tap at 2–3 MB each), so a step never outlives the list it counted (`boardChange.changed`, `Carried`). It
  was a hundred until 20 Oct.
- **Men the league holds no status for are not listed** (16 Oct 2026): 96 left its pool at setup and every figure
  of theirs was `—`, so "every player" read 639 where no filter could reach past 543. `shownRows` keeps them only
  when no man has a status, so a league whose statuses did not arrive still lists its pool. Compare's boxes still
  offer them.
- **A way out to Fantrax**, because this is where a manager decides who to claim
  and Fantrax is where the claim happens. We read their league and never write
  to it.

## The plates, the rate and the marks (10 Sep 2026)

*The plates and Per 90 are Adv Stats' since 16 Oct 2026; Players' few columns need neither. The marks stand on both.
`All` left on 19 Oct 2026, for Attack · Creating · Defence · Attributes (above).*

Craig put **Opta's season-stats grid** beside this board — *"it organises the
data much better than us, but we still keep our standard CM style"* — and four
things came out of it. All of them are URL state, so the board is still a server
component and any view of it is still shareable.

**Stat-group plates.** A blue strip of `All · Scoring · Attacking · Defensive ·
Discipline` under the search box (`Market` went with its two columns, 12 Oct 2026). `All` is first and remains the
default, so nothing Craig asked for on 6 Sep has left the board — the plates are
a way to put twenty-four columns down to eight, not a way to hide them.

**`Attributes`** (30 Sep 2026, Craig: *"a section where we can rank the players by their
attributes"*) is the last plate: one column per row of the player screen's grid under CM's
three-letter heading (`Fin`, `Pac`, `Wor`), sorted and marked like any count, filtered by
position in the drawer. It is the one plate `All` leaves out, because `All` already carries
twenty. The column it is sorted by leads, straight after the name: twenty-five run far past
the seven a phone shows. The ratings ride in the board's stats bag (`attributeColumns.ts`), and a man the grid
does not rate dashes. A keeper's three rows dash for every outfielder.

- The **spine** — name, position, club — is drawn under every plate. A column set
  that could hide the man's name would be a table you cannot read.
- **So is the column the board is ordered by**, which is `desk.ts`'s `standDown`
  rule in a second place. A hidden column is DELETED, taking the pressed plate,
  the arrow and `aria-sort` with it; sorting by `FPts` and then tapping
  Discipline would leave an order nothing on screen explains.
- The vocabulary is the pool's own and **not core's `GroupKey`** — this board has
  scoring and market columns no other board has, and no use for `appearances`.
  `groups.ts` records why it draws its own strip rather than using `GroupNav`.

**A per-90 toggle.** Every raw COUNT divided by the minutes behind it; a rate, a
rank or a share is left alone, which is what makes the toggle safe to leave on.
Two things it must not do, both of which it did for an hour:

- **It changes what the board SORTS by**, not just what it prints. `figureOf` is
  the single answer to "what does this column show for this man", read by the
  cell, the comparator and the mark arithmetic alike.
- **It refuses a man who has not played a match.** Without that floor the top of
  the board was a wall of men on `90.00` — one minute, one point, rated as if
  they played every week. They dash instead, and absent figures sort last.
- `GP` and `Min` are **never** rated: minutes per ninety minutes is ninety on
  every row.

**Floors (Craig, 21 Oct 2026, reversing "remove the minutes thing").** Under 270 minutes a man's per-90 figures, and
under 3 games his FP/G, still list, but they sort after everyone above the floor in either direction (still above a
dash) and print in the faint ink. They never set a standout cut. The constants live in `players/floors.ts`. `per90`'s
one-match dash stays below that. *A minutes floor had shipped with the toggle as chips and was deleted the same day*
(Craig: *"per 90 is just a toggle, remove the minutes thing"*): it hid men rather than sinking them, and spent an hour
hardcoded as `[0, 90, 450]`, where the `450+` chip emptied the board to "0 of 672" in gameweek 3.

**Standout marks**, which are the part that is ours rather than Opta's. Their
grid shades every numeric cell on a continuous brown-to-purple ramp; DESIGN §3
cannot have one, and Craig's ruling was to keep the idea and drop the ramp —
*"magnitude ramp, but maybe just highlight the really good values? we also can
use better colours for us too"*. So a cell is lit or it is not.

- ~~`--color-hot` / `--color-cold` grounds~~: retired 24 Sep 2026 for ink (above).
- **The rule**: the highest figures, taken whole values at a time, for as long as
  that stays inside a sixth of the men who have a figure at all. A column whose
  top value is common lights nothing — `YC` in August.
- **`GP` and `Min` are never lit** (`denominator()` in `columns.ts`, 21 Oct 2026): how much a man played is not how
  well, and the rehearsal league lit Min wherever 630 was not common.
- **The column the board is sorted by is never lit** (DESIGN §3, `unlessSorted`, 21 Oct 2026): its top rows are its
  top sixth by construction, so Craig's FREE board by `FPts` lit `FPts` on 13 of 13 rows. Every other column lights.
- **The population is the first hundred rows the query chose** (or every row drawn
  past that), so a mark re-reads on every filter but holds while Show N more pages
  in: the shares are tuned on a hundred men, and a 30-row page cut over itself lit
  a sixth as much and lost a tied top's orange (20 Oct 2026).

**The board is opaque**, and it is the only table in the app that is (Craig:
*"also it needs to be opaque too"*). `.cm-panel` is deliberately 88%, which is
right for a ten-row table in `text-base` and wrong for twenty-four columns of
`text-2xs` over a photograph with a white crowd in it. The frozen name column had
been opaque since it was frozen, so the board was rendering one solid column and
twenty-three translucent ones.

*Superseded 16 Oct 2026 by the two fixed phone lines above; the 10 Sep ruling on three header rows still holds, since
the phone row is still one chip line between the search and the heads.* **The controls are one row at every width** but the narrowest phones, where the status chips and Filter take a
second line together (320 today; under 390 once a league carries three statuses). Craig: *"when i said messy, i meant
essentially three rows of column headers"* — the blue group strip, the grey chip
field and the table's own grey head strip, the middle two wearing the same
`cm-bevel`. A chip and a column head are the same object in this vocabulary, so
three full-width rows of small bold capitals read as three header rows and a
reader cannot tell which belongs to the table. It was never the number of
controls.

*Superseded 16 Oct 2026 (above): position and Free/Owned are on the row at every width, and only Adv Stats' plates
and Per 90 step in, at `xl`.* **What sits on the row grows with the width, in two measured steps** (*"i think
we can get most things onto one row though"*, against Opta's desktop shot, which
runs search, stat tabs and its two figure controls across a single line):

- **below `lg`** — search, the status chips, `Filter` (Craig, 1 Oct 2026: *"mobile can have owned button show
  by default"*, *"find a player bar super wide, theres space"*). Everything else in the drawer. The box grows
  from 104px, what its placeholder needs; narrower than that, the chips and Filter take a second line together.
  An empty box lays out no clear button: its reserved space cut the placeholder to "Find a playe" in the 117px a 390
  phone leaves (Chrome and WebKit, 16 Oct 2026); "Find a player" is 88px of Jost at 16px.
  **`Find` is gone** at every width: the box searches as you type, and Enter submits it without a script.
  It folds accents, apostrophes, hyphens and spaces on both sides (core's `nameMatches`, which Compare's boxes share),
  so "Ødegaard" finds Fantrax's "Odegaard" and "Wan Bissaka" finds "Wan-Bissaka" (16 Oct 2026). **Every word typed
  must open one of his words**, in any order, so the phone's own "B. Saka", "saka bukayo", FPL's "B.Fernandes" and
  Fantrax's "Gross, Pascal" find their men, and "B. Saka" does not find Wan-Bissaka; a word may run on across the
  next, so "vandijk" still finds van Dijk.
- **`lg`** — the stat-group strip joins them. It is the most frequent tap, and it
  is the one that most deserves to be one.
- **`xl`** — the status chips and the `Per 90` toggle join them (Craig, 1 Oct 2026: *"on desktop have ww/fa
  filter in view"*); between `lg` and `xl` the sheet carries status. Per 90 was `2xl` while the minutes
  chips existed, measured: the frame is max-width capped, so 1440 has only 36px
  more than 1280 and the full set wanted 1136 of 1100. One chip fits at 1280.
  PLATFORM_NOTES carries the measured widths and the way the first guess failed —
  silently, by letting the `flex-1` plate strip fold `Market` onto its own line
  rather than overflowing.

Whatever is not on the row is in the drawer at that width, so nothing is ever
unreachable and nothing is ever in two visible places at once.

- The plate carries **a count of what is on**, so a shut drawer cannot hide a
  filtered board — and it counts **only what the drawer still holds at that
  width**, because totalling controls the reader can already see wearing their
  own pressed bevels is the screen saying it twice. The **caption names the stat
  group**, so a closed drawer cannot hide which columns are on either. `All`
  falls through to Scout's own caption rather than printing "All", which is a
  word about a control and not a name for a board.
- Inside, **one row and no headings** (*"get this onto one row… remove
  figures/who"*). It was three labelled bands for an hour, which was the right
  cure for eleven chips doing three unrelated jobs — and then two of the jobs
  left: the stat groups went up to the row above at `lg`, and the minutes floors
  were deleted. What remains names itself — `Per 90`, `Free agent`, `GK` — and a
  heading over a chip that already says what it is is furniture.
- **`All` leads the row and is pressed by default.** It is the only chip that is
  not a toggle: it drops both filter lists at once and cannot be turned off,
  because turning "all of them" off is not a state. Without it the row had no lit
  plate in its resting state and looked unset rather than deliberate.
- **It opens through the URL (`?panel=1`), not React state.** Every other control
  here is a link; a `useState` drawer would make the one control that reveals all
  the others the only one that needs a script. A link to "the board with the
  filters open on Defensive" is a thing you can send somebody.

**Two columns Craig cut on 10 Sep**: `Rk` is gone outright, not merely stood down
on a phone; and `Opp` is trimmed to the fixture — `MCI`, `@CHE` — by
`fixtureOnly`. That retires `(ET)` from its heading too: the zone note existed
only because Fantrax's kickoff times are US Eastern where every other clock in the
app is London, and a column with no clock in it has no timezone to name. With the
time gone the column is narrow enough to keep on the phone.

## The filters — several at once

Craig, 6 Sep 2026: *"think we need the ability to select multiple filters as
well"*. `?pos=D,M` — a comma list in one parameter, readable in the address bar
and shareable. Union within a filter, intersection between them: a defender OR a
midfielder, who is ALSO a free agent. Requiring every chosen position at once
would be a filter that empties itself on the second tap.

**A tap builds on the last one asked for, not on the last board that arrived** (16 Oct 2026). Every chip was a link
the server built from the board it last sent, so on a phone FA then WW 300 ms apart asked for WW alone, and a chip
tapped after a search dropped it. Each control now names only its own change (`boardChange.ts`: a toggle, a value
set, or Reset's keep-only); its `href` is that change on the server's query, for no script, and a tap applies it to
the query last asked for (`liveQuery.ts`), which the board forgets once a board lands. The search box, the club and
sort selects and the sheet's close build the same way. A toggle shows pressed at once: the bevel and the tick are
drawn off `aria-pressed`. The sort heads are still the server's links (`components/league/Board` draws them).

**They stopped being `cm-tab` when they became multi-select** (Craig: *"those
blue buttons for search are terrible here"*). A Championship Manager tab strip
picks ONE of a set and marks exactly one plate current — that is what the object
means — so six blue plates with any number lit is a tab strip making a claim it
cannot keep. They wear the raised/pressed grammar instead, which fits exactly,
and are the same grey plate as the column heads above them.

**The mark is a tick, not the accent.** `desk.css` says a plate owns its ink and
no call site sets `text-*` on one, because `--color-accent` on the grey plate
would be illegible. It was set anyway for one build and `probe.mjs` read the same
dark ink off a pressed chip and an unpressed one — dropped exactly as that
paragraph says it would be. The pressed bevel carries the state and the tick
carries it again as a SHAPE, which is docs/rules/PRODUCT.md's accessibility rule.

The status codes are Fantrax's (`FA`, `WW`, `T`); anything we have not seen
renders as the raw code rather than as a guess. *Since 16 Oct 2026 the row's bin is one `Free` chip (`FREE_CHIP`),
and FA and WW chips are the sheet's.* A chip prints the code the rows
print in brackets, and `Owned` for `T` (Craig's word), which the rows never print;
the word and the count are its title (`STATUS_CHIP` beside `STATUS`).

## Provenance, which is load-bearing here

The heading says which season the numbers are **and whether they were played or
predicted**, and a column headed FPts that silently switched between the two
would be the confident wrong answer.

*Fantrax used to default this read to a projection and now defaults it to
`SEASON_926_YEAR_TO_DATE` — re-probed 5 Sep 2026, PLATFORM_NOTES carries it. The
heading changed by itself, which is the whole reason it is read off the payload
rather than written here.*

## States

Unavailable — ownership is the part that would go stale first, so the page shows
nothing rather than yesterday's.

**Emptied by a filter** (16 Oct 2026, review N11). A board the filters emptied offers one link off it: *Search all
players* when there is a search (it keeps the search and the sort, drops position, status and club), *Clear filters*
when there is not. A bare search that finds nobody says so and offers nothing, since no filter hid him.

**Show all is `?all=1` and only that** (16 Oct 2026, review N22): `?all=0` or any other value draws what `?rows=` asks, the first thirty
without it; `?rows=` below thirty or not a whole number is the first thirty.
**A man with no minutes dashes in every figure** (`figure.ts`, Craig 21 Oct 2026, *"yes dashes"*): `Min 0` or `GP 0`
in the league's read is no reading at all, so FPts, FP/G and every count print `—` and sort after every reading either
way; Compare's FPts and FP/G follow. A man who played prints his noughts. His ratings stay, being no season's reading.
FP/G had dashed alone since 16 Oct 2026, when Fantrax's `0.00` padded 124 of 543 rows.

**A picker.** With `?compare=` naming a first man the board's rows lead to the
comparison instead of to a player, and a banner says so: a table whose rows have
quietly changed destination is a screen that lies about what a tap does. Since 21 Oct 2026 nothing links to it: the
player page's Compare with… button went when Compare became his tab (player.md), so it is reached by address alone.

## Known gaps

Still no sense of **who is worth looking at** beyond what Fantrax counts. The
football-layer signals the pool has always wanted — form, fitness, the fixture
run, and the positions your own roster is short of — are specified in
`~/.claude/plans/the-player-search-when-fuzzy-cupcake.md`; of their core half
only `availabilityOf` is built. They are not on the board yet.

## What came off on 10 Sep 2026, and what replaced it

**The count-and-season line under the title bar** (`672 of 672 · 2026-27 - YTD`)
— Craig: *"remove that row"*. It was doing one job worth keeping: saying whether
`FPts` holds what a man SCORED or what Fantrax PREDICTS. That read defaulted to a
projection until 5 Sep and can change again without anybody touching this app, and
a column headed `FPts` that silently switches between the two is the confident
wrong answer DESIGN §7 exists to prevent. So the provenance moved into the
**caption, and only when it bites**: year-to-date actuals are what a reader
assumes and get no words; a projection says so every time. A permanent bar
reading "YTD" is furniture, and furniture stops being read.

**`Pos`, `Club` and `Sta` stopped being columns** — *"position and club are
constants, they should be next to the player in the same column… probably status
too"*. They are identity rather than measures: nobody ranks six hundred men by
club, and three text columns between the name and the first figure meant a phone
opened on `M · MUN · 123` and no number. They now sit under the name inside the
same link, which is where every other table in the app puts a club. The owner
reads loud and a bare status reads quiet, which was the `Sta` column's whole
design and comes across with it.

*Three sorts went with them, and none of the three is a loss.* Position and
status have had filters in the drawer since **6 Sep** — they predate this work,
so removing those two columns was not a trade for anything, it simply took away a
sort nobody used in favour of a filter that was already better (you want
defenders, not a table beginning at D). Club was the one real gap, and Craig
closed it the same day: *"put club in the filters section though!"*.

**The club filter is a `<select>` and the other filters are chips**, which is the
only place this board mixes control shapes. Status has three values and position
four; club has twenty, and twenty plates is a wall that would take the drawer
straight back to the wrapped rows it was collapsed out of — while giving the
least-used filter the most space on the board. It is also single-value where the
others are unions: a reader wants defenders OR midfielders, and nobody asks for
"Arsenal or Chelsea". The clubs offered are read off the POOL rather than from
the football layer's twenty, so the list can never contain a club whose selection
empties the board. Each option filters on Fantrax's code and prints FPL's (`BRE`, `NFO`, not `BRF`, `NOT`), as
every other screen does (`toFplClubCode`; 16 Oct 2026, review N30).

**Every control on the row is one object at one size** — *"clean up this ui, all
buttons different sizes, we can CM this now"*. Five kinds of control sat on that
row at four heights and three type sizes: the search field at 44px and
`text-base` with no desk step at all, `SUBMIT` and `BUTTON` at `text-sm
font-medium` in sentence case, the chips at `text-2xs font-bold uppercase`, and
the blue plates at a third height. Championship Manager's chrome is uniform, and
`desk.css` already put the chrome FACE on all four plate classes — what it could
not do is the geometry, which is layout and belongs to the caller. `PLATE` in
`BoardControls` is that geometry, and the plates now differ only in colour: grey
for a thing you press, blue for a view you are on.

Two exceptions, both stated rather than drifted: the search **field** keeps
`text-base`, because below 16px an iPhone zooms the page on focus and a field is
read and typed into rather than pressed; and the club and sort `<select>`s are the app's one dropdown
(`shell/QuerySelect`, `SELECT`), the same plate every other screen's picker wears (2 Oct 2026).

*Superseded 20 Oct 2026: the stat plates dock at the foot on the main strip's ladder and are no longer
`cm-tab-quiet` (Adv Stats, above).* **The stat plates were `cm-tab-quiet`**, a new modifier — *"we already have blue
bars on this page, do we need them this big?"*. `.cm-tab` is 56px above `lg`
because CM's tab strip is chunky, and that reasoning is about the strip a screen
is navigated by; a second strip choosing a view of the same board is not that
object and competes with it at the same height. The modifier drops it to the 36px
control floor. It has to be a CLASS: `league/GroupNav` has carried a `lg:min-h-9`
since it was written and it has **never taken effect** — measured on the shipped
Team Stats board, where the plate computes `min-height: 56px`, because a Tailwind
utility and `desk.css`'s media rule are both one class of specificity and
`desk.css` comes last.

## The refactor pass (10 Sep 2026)

Run over everything above, twice, on CODE_RULES §1's arithmetic rather than
judgement.

**Extracted, with the count that justified it.** `PRESSABLE` — the grey bevel
plus the row's geometry — at **three** sites: the `Find` button, the `Filter`
link and an unpressed `Chip`. `ClubPicker`'s `<noscript>` button was a fourth
that differed only in having no hover, which was an oversight rather than a
decision; folded in.

`DASH` is one export in core's `format.ts` since 23 Sep 2026, adopted by every
literal in the same commit.

**A bug the extraction found.** The search form and the club picker each rendered
the rest of the query as hidden inputs by hand, and **both omitted `compare`**.
Every LINK on this board goes through `href()`, which spreads the whole query, so
tapping a filter chip while picking the second man of a comparison keeps the
first — exactly as `query.ts` promises. Typing in the search box did not: it
dropped him, and the board silently stopped being a picker. One `Carried`
component now renders the fields for both, from one list.

**Dead pipeline removed.** No column had set `deskOnly` since `rank` was deleted
that morning, so the whole stand-down apparatus in this module was inert: the
field on `PoolColumn`, `PlayerTable`'s `phone()`, the `hide` prop threaded into
five of `Cell`'s cells, and the skeleton's two copies. A field nothing sets,
plumbed through three files, reads as a capability the board has and does not.
`desk.ts`'s `standDown` keeps its other two callers. A test asserts no column
carries the flag, so restoring it means restoring the plumbing too.

**`ScoutShell.sub` removed** — no caller left once the count line came off; the
comparison screen never passed one.

**`MINUTES_KEY` made private** — the minutes filter was its second reader.

**Eleven stale counts corrected.** Six files said the board has "twenty-four
columns". It has **twenty**, and has since the four identity columns moved in
beside the player's name.

**The loading skeleton was describing a different screen** — its own docblock
says a skeleton must not, and it was: a header line that no longer exists, a
taller `Find` button on the old `BUTTON` recipe, three arbitrary-width bevels
where six named plates go, no `Filter` at all, and a round portrait where the
crest now sits. It reads off `POOL_GROUPS` and the shared recipes now, so it
cannot drift again. Its plates are deliberately inert: `loading.tsx` is given no
search params, and a link built from an empty query would drop a reader's filters
if he tapped one while waiting. *It went on 7 Oct 2026 with every loading frame (DESIGN §2).*
