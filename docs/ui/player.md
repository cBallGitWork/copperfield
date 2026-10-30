# `/players/[fantraxId]` — one player

Championship Manager's player profile (`reference/cm9900/11.jpg`), for a Fantrax
draft league. A plated bar in his club's colour, four tabs (Profile, Data, News, Compare), and one cyan line saying
what he actually is.

One profile per tap, never a sweep of the 697 — that is the whole politeness
policy toward Fantrax, and it is why nothing here may loop over `getPlayerProfile`.

## The shell

Every tab wears `PlayerShell`, which is `components/shell/PlateShell` — the third
plated subject, after a fantasy team and a club. It is given the `Subject` whole
rather than a name, a club, a number and a date, because the four views each
derived the same four from the same object.

- **The bar** — `5. Harry Maguire (MUN)`, CM's own construction. The club's
  SHORT name, where CM writes the full one: `5. Harry Maguire (Man Utd)` measures
  306px into the 282 a 390 phone gives the bar, so it shipped truncated.
  Only the pool's longest names (~24 characters) truncate now, and `PageHeader`
  truncating is shared behaviour rather than this screen's decision. A phone's
  `←` back plate (6 Oct 2026) leaves the title 302px at 390, where 6 of the 140
  rostered men's bars now cut short and none did before.
- **The born line** — `Born 21.7.00 (Age 26). Norway.`, from FPL's `birth_date` in CM's own
  unpadded `d.m.yy`, then his country: FPL's `region`, named by `/api/regions/`, never
  Fantrax's birthplace (which put Haaland, born in Leeds, down as England). **On the
  Profile only**, its first line (Craig, 1 Oct 2026, on Data: "remove the dob from all
  sections except profile"). It had been in every tab's shell, then on Data alone from 25 Sep.
- **The tabs** — Profile · Data · News · Compare (`tabs.ts`). **Transfer folded into the Profile on 21 Oct 2026**
  (Craig, N-12); `/transfer` redirects to the Profile. **Compare since 21 Oct 2026** (Craig:
  *"maybe we put compare in the player section too"*; PLATFORM_NOTES). **Inside his shell since 21 Oct 2026** (Craig:
  *"it needs to be housed in player section, and allow the ability to compare themselves to previous seasons too"*):
  `/players/<id>/compare` draws Data's Compare body (`analysis/CompareBody.tsx`) with him fixed as A, no A search box,
  B's box, a season select per side and the same views. **B opens on his own last season** (his most recent completed
  season with minutes, `compareRoute.ts`, `openingB`), or for a man with none on the rival: the man in his position
  group with the nearest season league points, ties to a free agent (`analysis/rival.ts`, `defaultRival`); with no
  points, or the pool silent, he stands alone. Under B's select, `v his last season` and `v <rival>` (I. Surname) are
  each one tap whenever B is not already that. A query naming only `bs` is him in that season. Old
  `/players/analysis?a=<id>` links still open Data's Compare. *Known:* the strip replaces history (`TabStrip`). **Five until
  25 Sep 2026**, CM's own count, when History folded into Data. Fitness folded into News on 4 Sep 2026
  (Craig: "Fitness could be doubled in with news") — they were two tabs asking
  one question with half an answer each. Which of them is hollow is decided from
  the SUBJECT, not from the page you are on; each route used to pass its own
  answer, so an unbridged man had the tab he was standing on greyed and the empty
  one left bright.
- **There is no caption box.** `PlateShell` draws CM's yellow one for a club and
  a fantasy team, which have nothing to put in it but the view name — and yellow
  means *active*, which the view you are on is. A player has something better,
  and CM gives that box to the man; but a birth date is not *yours · selected ·
  active · primary*, so it cannot take the accent, and with the tab strip already
  marking the view in accent two rows up a caption reading "Profile" spends the
  slot twice. So the player draws his own box, in ink.

## Profile

**Who he is, not what he has done** (Craig, 11 Oct 2026: *"Profile section, lots of 'data' in this section, move to
data section?"*). His season figures and the season maps moved to Data that day. **Whether he can play, whether he
is free and the run to come are the first screen** (Craig, 21 Oct 2026), so the order is: born line with the way out,
Fitness, Next up, portrait and grid, Business, set pieces, News, real position (`page.tsx`).

1. **The born line** with **the way out** beside it, in a word for what the reader can do (`fantraxExit.ts`): "Claim"
   for a man nobody holds and "Fantrax" for his own, both to his Fantrax page in the league; "Trade" for a rival's, to
   the owner's roster with Fantrax's trade panel up (`team/roster;teamId={owner}?tx=true`, Craig, 1 Oct 2026). Who
   holds him is the title bar's brackets, a free man's `(FA)` or `(WW)` (`bracket.ts`, Craig, 21 Oct 2026: *"we don't
   need status row, that goes in player row title at top"*). Then **Fitness**, for a man who may miss out only: CM's
   injury line (`FitnessLine.tsx`, Craig, 21 Oct 2026: *"fitness needs more colour and CM like symbols"*) on his doubt
   band's wash (out, major, slight), CM's mark in the loss red (a cross for a knock, a card for a ban, a barred circle
   for a man who has gone), the state box, FPL's words at a row's size, and his chance as four quarter blocks filled in
   his band with the figure beside them (FPL publishes only 0, 25, 50, 75, 100). A fit man gets no block.
2. **Next up**, the run to come: the next eight across the row, each fixture one 28px line in FPL's difficulty, the
   club with its venue a step down beside it (`3xs`), under the table's 24px plates in their 9px caps (Craig, 21 Oct
   2026: *"next up can be smaller"*), and under each
   gameweek the sister model's xMins in cyan (Craig, 7 Oct 2026: *"we have confidence of our xmins more"*); a run of
   one figure prints it once, beside the row's name (review D4, 30 Oct 2026). The
   projected points and rank under it, off since 7 Oct, went with the projections page on 19 Oct 2026 (Craig: *"ok"*).
   No source caption on the panel
   ("FPL's own · Fantrax's own remove"); a leading column names the row, `xMins`, since the
   titles never reach a phone, and the heading's aside dates them, "xMins as of Thu 15 Oct" (16 Oct 2026). *Fantrax's projection for the
   round was here and is gone* (25 Sep: "remove row"): it covered one period and only the men
   fielded, so it could not fill a run; the round just gone went on 4 Sep.
3. **The portrait**, his club's colour behind the cut-out, crest top-left: on a phone a 120px band (64px for a man drawn in his kit or initials, review D5) showing the whole
   cut-out (`object-contain`), so fitness and the run stay on the first screen (Craig, 21 Oct 2026, reversing 25 Sep's
   banner and 4 Sep's portrait-first order); on a desk a 208px column as tall as the grid, filled to its foot (Craig,
   25 Sep 2026: "cut off mid box").
4. **The attribute grid** — CM 01/02's: alphabetical down three columns on the desk and two
   on a phone, 16–20 in CM's orange and 11–15 in amber, with **Preferred Foot** (off the shot
   map) as its worded row. Every rating is OURS,
   per 90, against **every man of his role** (Craig, 30 Sep 2026: "judge against all
   outfielders who actually play"): keepers against keepers, the rest against all
   outfielders, so a centre-half's Finishing is low as CM's is. The sample is **last
   season's** when he played a third of the most minutes anyone did (1,140 in 25/26), else
   this season's against the same third ("new players get this season"); the heading says
   which, `25/26 · against outfielders`. A keeper gets six rated rows, an outfielder twenty-one and Preferred Foot.
5. **Business** — every claim, drop and trade the league has made with him, newest first, on the house table
   (`Moves.tsx`): the date in the index block, then the move, from and to ("The pool" for no team), a step above a
   row's type (Craig, 1 Oct 2026: "make text bigger in business"; DESIGN §6's third exception), sized to its columns
   on a desk. A man the league has never moved gets no panel.
6. **Set pieces**, one line of label and figure (`Penalties 1st · Free kicks — · Corners —`, 21 Oct
   2026; a one-row table before), a duty at his club rather than a count: his place in his club's
   penalty, direct free-kick and corner orders (Craig, 30 Sep 2026: "their fk/pk/corner rank for the club"), the same order the
   club's Set Pieces tab draws, counted among the men still there; a dash beside an order he is not in; no panel when he takes none.
7. **News** — Fantrax's newest note on him, its own block under set pieces (`Fitness.tsx`, `LatestStory`), as
   **plain text** (Craig, 1 Oct 2026: *"just remove the chip row and email style preview, just put the text in, with
   date/time and make text bigger"*): when it was filed, then the whole of it with its analysis, at `base`/`lg:text-lg`.
   **A phone gets only its first paragraph** (Craig, 20 Oct 2026: the News tab has the rest; no link or "more"); the
   desk keeps all of it. Only the newest: the list is News's. No source caption. With none, no panel.
8. **The real position**, in cyan — the first thing in the app entitled to that
   slot (see below).

The **Compare with…** button that closed the Profile went on 21 Oct 2026, when Compare became a tab.
**A man with no season to rate gets no reading on any row** (21 Oct 2026), the set-piece shares (Penalty Taking, Set
Pieces) included: they had printed a rating off his club's orders alone (`core:football/attributes.ts`, `share`).

## Data

His record, one season at a time (Craig, 25 Sep 2026: "maybe we merge data and history
together, shows current season by default with other seasons on a dropdown"). **History
is gone as a tab** and `/history` redirects to `?season=all`.

- A **Season** picker: this season (the default), each season
  FPL's history lists, and **All seasons**. It is `?season=`, so a shared link keeps it. Over a past season or
  All seasons it drops its visible label (review M-CONSIST-4, 20 Oct 2026): the table's own head names the block, and
  the select keeps the accessible name "Season".
- **This season**, in this order: Every match (with its season foot), then the season maps (Craig, 21 Oct 2026, N-13;
  reverses 25 Sep). The Season table and Attacking were removed on 11 Oct 2026 (Craig: *"remove these two sections in
  data"*); the Data board still lists the stats league's counts.
- **Season maps** (Craig, 9 Oct 2026: *"Put shot map and pass map and touch map into the player profile section"*;
  moved here on 11 Oct with the rest of his figures), each map under a strip in his club's colours carrying a word
  and a count and nothing else:
   - **Shots** — every shot this season on the attacking half, the house's marks (`ShotMarks`): size is the xG by
     its square root, a goal filled, on target a ring, off target or blocked a faint ring.
   - **Shots set up** (captioned "Chances created" until 21 Oct 2026) — every shot in the file whose `assistCode` is
     his, drawn where it was struck, with Compare's dashed key-pass line from where his pass began (a square); an
     assist is the filled mark. A chance the file places no pass for is the mark alone. Its count is the marks drawn,
     so it can differ from the `KP` in Every match's Total.
   - **Touches** — every touch this season, merged across fixtures, as Compare's heat (`analysis/HeatPitch`).

   A half pitch is drawn reaching back only for a shot or pass that began in his own half (5 of 1,363 shots and 8 of
   695 passes in the export of 7 Oct). Two halves and one whole pitch share one height: on a phone the halves pair across
   the row and the touch map takes the next, ~520px for all three; on a desk the three run across in 1:1:2. A map with
   no rows is not drawn, no rows at all is no panel, and a keeper gets the touch map only. Picked in `maps.ts`
   (`seasonMaps`, `attackingSpan`), tested. The maps and Every match's season foot read no FPL, so they still draw when FPL is silent.
- **Every match** — the house board (Craig: "not like our normal CM standards, use the shared code") —
  bevelled plates over the figures, the round in CM's blue index block and the opponent's
  crest pinned beside it, and each column's best in CM's orange and its top quarter in
  yellow, as the pool board lights them. **`FPts` is the first column** (Craig, 12 Oct 2026: "this needs to have fpts in
  the first column"), printed in the reading cyan, match by match and in its Total, which still sums (its own `cyan`
  flag in `matchColumns.ts`, not `derived`; Craig, 21 Oct 2026); then the score, which links to `/prem/match/[id]`.
- **The season foot** — Every match closes on a Season plate, a Total row and a Rank row. Total is the ranked season
  figure where the column is ranked, otherwise the sum of the matches he played, dashed if any lacks it; Rtg shows his
  average (`totalOf`). Rank is his place in his position group (`core:football/rankings.ts`), `—` with no minutes;
  top in CM's orange, its top tenth (at least the top three) in amber. "Ranked among N <group>" heads the board. `FPts`' Total and Rank are the
  Data board's season points off the cached pool, absent while the pool is silent or holds a projection. **`KP` is the
  stats league's key passes** (`data/intel/stats`, `keyPasses`), a foot under a column of dashes, since the league
  counts them for the season only. Rankings as its own table is gone (N-13; it led Data from 11 Oct, `FPts` first from
  16 Oct).
- **A past season** — FPL's line for that season, with the club, then the same season maps for that season
  (21 Oct 2026) off `data/intel/past-maps/<season>.json` (`scripts/intel-past-maps.py`, a one-off for 21-22 to
  25-26): Shots and Touches, no chances map, on a plain plate, since his club now may not be that season's. Only the
  chosen season's file loads (`app/pastMaps.ts`). **Wherever there is no chances map** a desk runs the two maps
  across three columns and a phone fills the cell beside Shots with **Outcomes**: goals, saved, post, missed and
  blocked, each by its mark, and the xG (`SeasonMaps.tsx`). *Known gap:* SofaScore's 2023/24 shot maps miss 42 goals
  in 35 player-matches.
- **All seasons** — every season with the **club he was at** ("mention what clubs he
  played for"), from the sister's identity store (`intel/careers`). A club is printed only
  against a season FPL lists: the store has Haaland at City in 21-22, when he was not in
  the league. No maps. The heads are `Min G A CS GA Sv Yel Red` (`PastSeasons.tsx`); the club prints as this
  season's code under a thumb, as the match log does, and its full name from `lg` (`seasonClub.ts`); a club no longer
  in the league keeps its name, clipped.

**After the points and the score, two provenances on one row, with a rule between them.** Left of it is FPL's
measurement of the play — minutes, goals, assists, xG, xA, clean sheet, a keeper's saves and goals prevented, and
`Def` (tackles + CBI + recoveries); FPL's DefCon column is gone from it, so one idea prints once per screen (DATA-1). (FPL's
bonus and BPS came off on 6 Oct 2026, the FPL tab's alone); FPL's own points came off on 30 Sep 2026 so they never sit beside `FPts`, and the
board carries no source caption ("FPL's own · Fantrax's own remove"). Right of it is Fantrax's account of the same match
(its `FPts`, the only per-match source of this league's points anywhere, leads the row instead):
the five things FPL does not publish at all: shots, shots on target, fouls
committed, fouls suffered, offsides.

**A match he was not on for dashes every figure but `Min`** (21 Oct 2026, `MatchLog.tsx`); `FPts` prints what the
league paid, and a column only his sat-out matches filled drops out. **Zero is a stat on this board** (16 Oct 2026). `CS` prints `1` or `0` for a match he played and dashes one he was
not on for; it printed `Y` or a dash until then, so a keeper who conceded read as unmeasured. **A column none of his
matches measured stands down**, its rule passing to the next: Fantrax's keeper table carries no shots, shots on target
or offsides (Tzolakis and Raya, probed 16 Oct), which drew a column of dashes on every full 90. **Columns are picked
by role first** (Craig, 21 Oct 2026, N-14): a keeper never draws G, A, xG, xA, Def, KP, Sh, SoT or Off, and an
outfielder never draws Sv or Prv (`columnsFor`). Within a role a column still stands down only when nothing measured it
and nothing ranks it.

**Our mark closes the row, behind a third rule** (Craig, 1 Oct 2026: "put ratings into the player/data section too").
`Rtg` is our rating out of ten for the match, in the derived reading's cyan and never lit as a standout, from
`data/ratings/26-27.json`, which `npm run ratings` files after each settled match day. A match not yet rated, or too brief to rate,
dashes.

**FPL's history is the spine and Fantrax fills in.** They are joined on the
opponent and the venue — safe in a league season, since a man plays each opponent
once at home and once away — and the codes are translated first, because Fantrax
says `NOT` where FPL says `NFO`. Fantrax's table is captioned "Recent Games" and
they do not publish how far back it reaches, so a match beyond it dashes on all
six columns and a line under the table says how many of the matches they covered.

**The rows are tap rows, not CM's 18px.** A tappable score makes its row a tap row, `TAP_ROW`: 36 under a thumb,
the desk's 28 (the one table spec, 21 Oct 2026). CM's appearances table could be
dense because nothing in it was clickable. That is the price of the link and it
was paid deliberately.

*It was two figure grids for one commit* (Craig, 4 Sep 2026: "Grids is absolutely
terrible"). A grid of season totals cannot show form, which is the question a
manager actually arrives with.

## News

**Mail's own shape** (Craig, 25 Sep 2026: "should match the Email/news section"): the
dated list beside the letter on a desk; on a phone the whole list, and a tapped story on its own under
`← All news` (6 Oct 2026, with Mail's "allow more rows"). The open row is on CM's red
ground, and the story opened in Mail's `Letter`, from "The news desk". Since 30 Sep 2026
it is Mail's own code, not a copy: `news/Mailbox` and `news/MailRow`, and Mail's empty panel. **The preview
is the whole first sentence** ("text on preview line cuts off too early"): Fantrax cuts its
headline at about a hundred characters with "...", so where the story begins with the cut
headline its first sentence stands in, over two lines.

**Fantrax's stories and nothing else** (Craig, 4 Sep 2026: "Remove the FPL part").
FPL publishes one availability line, and that is a STATE rather than a story —
whether he can play, which the badge and the pitch already answer. Putting it in a
list of dated reports made the newest item a sentence saying nothing had happened.

**Trimmed to 1 July**, which is where a football year starts and where a summer
signing's news begins to matter. The year is derived from the date rather than
written down: January to June belongs to the July before it, so a constant would
be wrong from New Year's Day and would silently show eighteen months.

The body is dropped when it IS the headline. Fantrax files match reports whose
headline and content are the same sentence — most of them — and printing both put
one line twice under itself. A transfer story has a longer body and gets both.

## Transfer

Folded into the Profile on 21 Oct 2026 (Craig, N-12; reverses 25 Sep's "more CM like" tab); `/transfer` redirects to
the Profile. The status line, Business and the way out are the Profile's (above); the draft row, its `+N on his pick`
and "Dropped by" are gone, so the app makes no `getDraftResults` read. The whole-of-Fantrax block (drafted %, ADP,
rostered %) stays gone (4 Sep 2026).

## History

Folded into Data on 25 Sep 2026; see above. **The seasons table shows only the columns
that are real in every season.** FPL writes every key on every row back to 2014/15, so a
statistic it did not collect that year arrives as a nought rather than an absence;
`fpl/raw.ts` carries the count.

## The attributes

Sports Interactive's are licensed and there is no feed for them: the route through
FM26 is a plugin, an in-game keypress and a manual CSV of whatever columns are on
screen. So every rating here is derived from play we already measure, on CM's 1–20
scale, and **what we cannot measure gets no row** — Agility, Balance, Bravery, Flair and
Technique are absent rather than invented.

Each row's source is in its title. The ones Craig called on 30 Sep 2026: **Finishing** is
expected goals on target per 90 ("finishing should be using xgot"; goals less xG put
Haaland at 3 on 25/26, this puts him at 20); **Work Rate** is distance covered per 90 and
**Pace** top speed, both off SofaScore's running, which exists only from 26/27 ("work rate
could use our running data"); **Acceleration** is sprints per 90. **Consistency** is his
mean match rating over his worst quarter of starts, because a spread of ratings put every
striker at the bottom; **Teamwork** is xGBuildup per 90, because touches did the same;
**Handling** is the share of shots on target he saved, because saves per 90 put Raya at 1.
The counts are the sister's `lines/{season}.json` (`docs/providers/intel-export.md` §9).

**Anticipation** is the best of three placings: recoveries; clearances, blocks and interceptions; touches in the
opposition box, each per 90. Each man's best is ranked again against everyone's best, so it stays a flat 1–20. A
keeper's is his recoveries alone. (Craig, 21 Oct 2026: recoveries alone put Haaland at 1 and Virgil at 3.)
**Penalty Taking and Set Pieces** rate only the men who take them: a man who takes none reads `—`, not 1. **Keepers
have no Influence**: FPL's is mostly saves, which put Raya at 1 behind a quiet defence.

It is the fraction of the cohort he is strictly better than, not the midpoint of his tie, in twenty equal slices, so a
block of noughts in a count sits at 1.

The ratings are set in CM's orange (`--color-peak`) from 16 and amber (`--color-mid`) from 11,
never CM's yellow: yellow is `--color-accent` and means *yours · selected · active*.

## The cyan line

`Defender (Centre)` — his real position, from the sister repo's role pipeline,
which weighs FotMob, Understat, SofaScore and recent Premier League starts,
written in Championship Manager's own words: the roles joined by a slash, the
sides joined by a slash in brackets, as `cm9900/11.jpg` closes with
`Defender/Defensive Midfielder (Left/Centre)`. `realPositions.ts` holds the
twenty codes.

**`secondaryPositions` only, never `canCover`.** The depth chart is who could fill
in, not where a man plays — Maguire's is `DM/LB/RB`, and it was printed here for
one commit (Craig, 4 Sep 2026: "Maguire not a dm or rb"). 70 of 651 have a real
secondary; the rest print one role.

This is the first thing in the app that *means* what the cyan slot means. DESIGN
§3 retired "cyan means a person" on 3 Sep 2026 and left the slot for *"a derived
reading — ours rather than recorded"*, near-empty until a derived figure claimed
it. A weighted role is exactly that, and §3 names Position among CM's own cyan
columns.

Near-empty rather than empty: the assist chip and the captain's armband already
wear it, and both are recorded facts rather than derived readings — pre-existing
occupants of a slot whose meaning changed under them.

**Never FPL's `element_type`**: 146 of 651 men have null here, and the screen says
which of the two silences it is — no row at all, or a row whose only position came
from FPL's fantasy classification.

## States

- **An id the pool does not hold is a 404** (16 Oct 2026): when the profile read is refused, the cached pool decides
  (`unknownToPool`), so `/players/zzzzz` and its tabs answer the app's own not-found page. A pool that is not
  answering decides nothing.
- **No profile for that player**, for a man the pool holds whose profile read was refused: one line, with the read's
  code on the element (`data-code`), not on the screen (12 Oct 2026), and an `Every player` button back to Data.
- **A man the bridge has never settled** — 88 of 694. No portrait, no grid, no
  position and no history, each saying why. Fantrax's own blocks still draw, so
  Profile and News are not empty; Data is.

## Known gaps

- **A rating is a ranking in this season, not a claim about the footballer**, and
  early in one those come apart. Most of the division is on nought for most of
  these measures, so any non-zero figure clears half the league at once: three
  rounds in, Maguire's 0.01 expected assists rated Passing 18 — true as a ranking
  and worthless as a reading. It settles as the season fills, and it is left
  undamped deliberately: damping needs a confidence model nobody asked for, and
  turns a number that is honest-but-thin into one that cannot be explained.
- **Tackling counts volume**: the centre-backs of sides that keep the ball make few tackles (Virgil 2, 21 Oct 2026).
  A possession-adjusted count would come from the sister repo.
- **The grid is twenty-one attributes against CM's thirty-one** (`core:football/attributes.ts`, 21 Oct 2026): the
  rest have no measure we hold, so they get no row (above).
- **`getPlayerProfile`'s deeper sections are open, and three are unread.** The
  parameter is **`tab`**, taking the `code` off the payload's own `sections` list —
  found on 4 Sep 2026 after eleven other names were tried and ignored. `NEWS_NOTES`
  is read. **`TEAM_SERVICE_TIME`** (a row per gameweek: team, status, position),
  **`TRANSACTIONS_FANTASY`** (richer than the league-wide feed — it names what was
  dropped in the same move) and **`GAME_LOG_FANTASY`** are not. Service time is
  what a CM transfer history would really want.

## Rebuilt against the reference, 4 Sep 2026

Craig read the built screen and sent a list. What changed, and what the change
answers to:

**The bar names the FANTASY side, not the club** — `Bruno Fernandes (123)`,
and no shirt number. CM writes `3. Michael Ball (Everton)` because in that game
the club is the thing you manage; ours is not, the club is already on the
portrait in its own colours and on its crest, and the number was null for 98 of
625 men.

**The caption carries where he is from** — `Born 8.9.94 (Age 31). Portugal.`,
which is `cm9900/11.jpg`'s own line (`Born 2.10.79 (Age 19). English.`). The
country is taken off the end of Fantrax's birthplace and the town dropped; the
adjective is not invented, because a demonym table is not a fact we hold. The
Birthplace/Height/Weight block went with it.

**Keepers get their own grid.** Each row in `football/attributes.ts` says whose it is
(`for: "keeper" | "outfield" | "both"`); the app reads the role off the sister repo's real
position, because the football layer holds no position by rule. No name means one thing for
a keeper and another for an outfielder, so Compare can pair rows by name.

**Good attributes are the loud ones.** A step down in loudness rather than a
second hue: `--color-mid` above 15, `--color-muted` to 8, `--color-faint` below.
Red was the obvious reading of Craig's *"orange/red"* and is refused —
`--color-bad` means *a loss, a doubt, a negative*, and a 19 painted with it
inverts the one slot the rest of the app leans on.

**The position line closes the screen**, in cyan and at `2xl`, which is where
`cm9900/11.jpg` puts `Defender/Defensive Midfielder (Left/Centre)`. It had been
inside the grid column, reading as a caption on the attributes.

**It had also never been cyan.** `.cm-panel` carried `color: inherit` — a
declaration a panel does not need, at the same specificity as Tailwind's
`text-*` and loaded after it, so `class="cm-panel text-info"` resolved to the
inherited ink and the utility was silently dropped. Found by reading the rendered
colour rather than the source. `desk.css` records it.

**The appearances table is CM's**, not FPL's: competition rows down the left
against plated heads, `Apps Min Gls Ast Con CS Sv Yel Red FPL`. One row, because
FPL publishes one competition — five rows of dashes would be five confident
statements that he has played no cup football.

**History is FPL's stack in our formatting** — this season as the first row of
one table, the completed ones under it. Two tables with the same heads, one above
the other, is a reader checking whether they agree.

**Transfer says how he arrived once**, in the status panel's Draft row (`13th pick, by Atletico`),
never with the round; the closing cyan sentence that repeated it went on 12 Oct 2026, and the Draft row with the tab
on 21 Oct. The whole-of-Fantrax demand block is gone.

**News opens any item.** `?story=` in the URL rather than client state, so a
story can be linked and the tab stays one server read. Rows carry the time as
well as the date, and the headline no longer prints twice.

**No foot buttons on any tab.** CM's foot is Back/Next; ours were named
destinations the rail already reaches at every width.

### What the pass deleted

`Facts.tsx` (both readers removed), `Breakdown.tsx` and `season.ts`'s
`playerSeason` — the Fantrax year-to-date pipeline behind the History block that
went. When a screen goes its reads rarely go with it; these were found by
following each export back to a consumer and finding none.
