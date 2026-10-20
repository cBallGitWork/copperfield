# `/league/matchups/[teamId]` — one head-to-head, at full size

The Saturday screen. The scoreline, and the eleven behind whichever half of it
you are looking at.

The team in the URL is the side the board **opens on**, so tapping a name
anywhere in the app arrives on that name's team. Which side Fantrax calls home
decides only the ground: the page is drawn over the home team's venue
(`data/leagues/venues.json`, the desk's own photograph for a team it does not list).

**`?gw=` names a week the league plays** (`leagueWeeks`, `askedWeek`, as the squad's picker reads it): one it does
not play (5, 99) opens the default, as no `gw` does, and the board's own links drop it.

**`?vs=` names the other side.** A double header (two ties for a team in one period, GW34) means the team alone
does not say which tie, so a link into a matchup carries the opponent in `matchupHref`'s `vs` (`tieHref` for a tie
opened on one of its sides). The pairing cards, the schedule and the paper's scoreboard always name it; YourMatchup
names it on a double header, and the live strip on a double header's second tie. `pickTie` (`views.ts`) opens the tie `vs` names, else the schedule's first, so a stale or missing `vs` still
lands on a tie. On the page the view, Stats and sub-view links keep `vs` only for the second tie, so a single tie's
URLs read as they always did. A double header draws a **tie strip** above the scoreline: a `TabStrip` labelled
"Ties this gameweek", one plate per tie reading `v <opponent>`, on the same round and view (`tieTabs`). A single tie
draws none.

## On the page

1. **One scoreline row** — `123 · 59.1 · v · 63.2 · test3`, read the way a score
   is said out loud. Names at the outside edges, both numbers meeting in the
   middle either side of the `v`. A phone prints the league's short names (Truffles, Beef) at 14px, as the foot
   strip's Stats tabs and a round not kicked off's captions do: nine capitals fit a half at 390, where
   "THE TRUF…" had (Craig, 11 Oct 2026). Each half is the control that opens that
   side's team below; the open half is raised and carries a foot bar. Your own
   name reads in accent, the standard "this is yours" mark. **One number per
   side and nothing beside it** — see the constraint below. A phone gets the
   `←` back plate at its left, as a match does; on a board opened cold it goes to that gameweek on Draft › Fixtures,
   where the tie is listed (review M12; it went to `/league/matchups`, which no plate lit, retired 20 Oct 2026). Before a ball is kicked the board
   is the same board, each side's Line-ups a squad list instead of a pitch, and Stats is off the strip until kickoff
   (Craig, 19 Oct 2026: the bare two lists had "no page template"). A side the lineup gate has opened, your
   own always, is its eleven then a plated Bench in Fantrax's bench order (`TeamSheet` as a list); a rival before
   his lock stays unarranged, alphabetical within a line, so nothing leaks who starts (`unplayedLists`; review N6,
   16 Oct 2026: your GW7 preview was two 14-man lists).
2. **A four-plate blue tab strip** — `Line-ups · Stats · Fixtures · Table`, each a link
   (`?view=`, Line-ups the default; `views.ts`), so a refresh or a shared link keeps
   the tab. One word per label: the strip has to fit 390.
3. **Line-ups** — the open side's eleven on the grass and its bench in a strip
   under it (`TeamSheet`, `mode="pitch"`). Both sides at once above `lg`. On a phone the grass and bench fill
   the screen down to 16px above the rail (Craig, 11 Oct 2026; [squad.md](squad.md#the-pitch)).
   **The one view that belongs to a side**, and the only reason the two halves of
   the scoreline are a control rather than a caption.

   **The list went, and it was a whole tab** (Craig, 11 Sep 2026: *"pitch and
   list dont need to be two screens, come on, should just be Scores for that
   view"*, then *"just pitch i think"*). `SquadRows` keeps its two remaining
   callers on the squad and club boards.
4. **Stats** — three sub-views switched from the **foot row** (`StatsViews`, a `TabStrip`,
   `?of=`): *side A · side B · Fantasy*, opening on Fantasy (Craig, 24 Sep 2026). **Docked at every width**: above
   the thumb rail on a phone, at the screen's foot on the desk, as `SaveBar` is: `FootFrame`'s `foot`. A phone's sat
   at y=868 on an 844 screen, under the rail, until 16 Oct 2026 (review M7).
   - **Fantasy** — `CategoryBands` in the match page's Fantasy layout: a grey plate
     per category with each side's total at its end, then each side's men meeting at
     a centre rule, "crest Name (pts)", the points green or red. The eleven only. A side whose eleven registered
     nothing in a band prints **0** (zero is a stat); only a side with no reading prints the dash. Two categories
     with one name ("Goals conceded" in goal and on the pitch) are titled by the slots their men stood in,
     "Goals conceded · GK" (`bandTitles`; review M42, 16 Oct 2026).
   - **A side** — `SideStats`, the match page's club board for one manager: his
     colours on the position tiles, each man's club crest, Fantrax's points, then
     what he did in each league category (counts, noughts included), in Fantrax's
     own row order. A figure is green where Fantrax paid him for it and red where it
     docked him (`gainOrLoss`), at his roster slot. No sub notes: the pitch has them.
     Sortable (`?sort=`, `?dir=asc`); the bench below the eleven, dimmed and "not counted".
   - **Minutes played is on neither** (Craig, 1 Oct 2026), found by Fantrax's long
     code (`MINUTES`), so the bands no longer sum to the scoreline. Both read the
     served league's own categories: the real league's (`AT`, `GKP`, `DFP`, `DFP3`) from go-live.
   The Players tab went into this on 24 Sep.
5. **Table** — the league standings, with **both sides of the tie edged in their
   own colours** (`TableTab` → `/league`'s own `Columns` and `TableRow`).

   Craig, 11 Sep 2026: *"goes to a page with just the league table (not the
   league table page itself)"*. What it answers here that `/league` does not is
   what THIS result does to both positions, which is why both rows are marked
   rather than only the reader's.

   **The mark could not be `TableRow`'s `mine`** — that paints `bg-raised`, and a
   tinted band "reads as *these are yours*", which about a rival is a lie. It is
   a `tint` prop, and it rides on the INDEX CELL rather than the row: `yoursEdge`
   hands back a *transparent* border on unmarked rows precisely so one row's
   figures do not step 4px out of the column, and a `<tr>` border does not paint
   through the index cell's own ground at all. `mine` wins where both apply.
6. **Fixtures** — every Premier League match either squad has a man in, in kick-off
   order, each drawn as the Live tab draws a fixture (`ScoreRow`: table places,
   crests, score, live minute or FT, a link to the match). Under each row, each man
   under his own club, home left and away right, chipped in his manager's colour, with Fantrax's points between
   chip and name (Craig, 19 Oct 2026: split by manager, Cunha sat under Chelsea). A reserve is dimmed and
   uncounted, and a double's period figure prints under the later match only (`fixtureMen.ts`). A side whose eleven
   is not public names nobody; before kickoff a rival's squad is public, so his men are named, with no figures. It replaced Scores on 24 Sep (Craig: *"scores is pointless"*).
7. **A live player card** (`LivePlayerCard`) over the top, when one is tapped.

## What the round is doing

One word, and it is the only thing on the board that makes a
promise about the numbers beside it. **Once the round is over it is the line under each side's name**, in place of
"to play" (`RoundWord`); while it runs that line counts the men left, and the LIVE dot is the chrome's strip. A
finished week also draws **none of today's fitness**: its men are drawn fit (`withoutFitness`) and the card carries
no story, since a doubt dated after the week is not the week's (review N9, 16 Oct 2026: Mainoo gold on GW6, which he
played).

| `state` | On screen | When |
|---|---|---|
| `"live"` | LIVE dot + word | `isMatchdayLive` — a match actually in play |
| `"bonus-settling"` | "Full time" | every dated match finished, bonus not yet added |
| `"provisional"` | "Full time" | bonus added, FPL has not signed the round off |
| `"final"` | "Final" | FPL's `data_checked` |
| `null` | nothing | between kickoffs, and any round nobody is playing |

**Two rungs, one word, on purpose.** `bonus-settling` used to add a faint
*bonus settling* under the caption. It named FPL's bonus ladder as the reason the
number beside it was still shifting — and the number beside it is Fantrax's,
under scoring that has no bonus category. Checked against both leagues on 22 Aug:
the rehearsal league scores CS A RC Min PKM GAO AF G OG YC, the real 10 Oct league
a richer set again, and neither has one. The difference between the first two
rungs is FPL's, and this board is not showing FPL's numbers.

That leaves an open question rather than a settled one: if Fantrax's ledger
closes at each whistle — and every played fixture was fully credited by them on
22 Aug while FPL still had all six `finished: false` — then "Final" on a Fantrax
scoreline is earned at the last whistle, not at FPL's sign-off a day later. One
day's observation is not enough to move a promise on.

**The dot used to burn all Saturday.** It was driven by `duringGameweek` — the
window from the first kickoff to the last whistle — which is the right question
for *how often to poll* and the wrong one for *whether a match is on*. Tea-time
between the 12:30 and the 15:00 had nothing in play under a pulsing LIVE dot.
The poll rate reads the match window (`secondsToWindow`), fast between one
day's kickoffs and idle overnight; the word reads `isMatchdayLive` and `roundFinished`.

**"Final" is claimed only at `data_checked`.** A manager watching his total move
under the word Final would be right to stop believing the screen, so the two
rungs before it say full time and — while bonus is still landing — say why the
numbers are shifting. `roundFinished` is in the football layer and tested there;
`null` covers both "in play" and "not started", which the board tells apart by
pairing it with `isMatchdayLive` rather than inventing a fourth state.

## The two providers

The scoreline is `getLiveScoringStats` — Fantrax's own totals under Fantrax's own
scoring — **plus the auto subs Fantrax will make at the period's end** (see [Auto subs](#auto-subs)). Until
19 Oct 2026 this said "which we never recompute"; Craig's GW7 (31 with Sarr blank, 34 with Kerkez on) superseded it.

Everything under a player is **two sources joined**: his fantasy points come from
the same `getLiveScoringStats` payload, priced at his slot — reserves included
since 24 Sep, uncounted — and what he *did* — goals, assists, clean sheet,
minutes — is **FPL's**, joined through the identity bridge.

**The provenance line came off the top of the screen** (Craig, 11 Sep 2026:
*"remove A round already played… row"*). It was 44px of prose over a scoreline
nobody was asking it of. Its last home, the Stats board's `Section` aside
("Fantrax's own · the stored eleven"), went on 12 Oct 2026: a screen never names
its source ([README](README.md) principle 2).

*Closed: the points now come from `getLiveScoringStats`, which honours the period.*
**`period` does not price the week, and this paragraph used to say it did.** It
was probed on 19 Aug and `displayedPeriod` does echo, with `periodOppnentTeamIds`
changing to match — so the opponent column moves. Re-probed on 22 Aug with real
numbers in the payload: periods 1, 2 and 3 answer **byte-identical** points, every
category line included, and `SEASON_926_BY_PERIOD` behaves the same way. What the
board prints under each man is season-to-date under a card headed "This period".
Invisible while the season is one gameweek old and wrong from GW2. Recorded in
HANDOVER §4 as the thing to take next.

If Fantrax refuses the points table for a side, that side's players fall back to
their **minutes**, told apart by the apostrophe on them. One table either arrives
or it does not, so a side never mixes the two.

## What a tap answers

`LivePlayerCard` — a second card, distinct from the squad screen's `PlayerCard`,
because they answer different questions on different days. `PlayerCard` is "who
is this, and is he fit", read midweek. This one is read at ten past four, and the
only question is *why* he is on the number he is on.

- **An itemised points table** (`league/Breakdown`), one row per scoring
  category that moved his total, largest contribution first, each carrying the
  count Fantrax states beside the points it paid — gains green and deductions
  red, DESIGN §3's direction pair — and the total under them. Every figure is
  **Fantrax's**, under our league's own scoring, read from the scoreboard's
  own `getLiveScoringStats` payload, and they sum to the total exactly. A
  reserve's card says he is on the bench and not counted. Nothing is computed here — our own engine could only ever
  have approximated the five categories FPL does not publish, and would have had
  to caveat every line.
- Categories that scored him nothing are dropped, and so is games played, which
  in this view renders as 0 because a count of appearances is not a score.
- **What he did under a drop-down** (`league/FullMatchStats`): shut it is the words
  "Full match stats" and a chevron, open it is Opta's parts of what Fantrax
  counts whole and the league prices at his slot: penalties won, and a keeper's
  saves, smothers, punches and high claims. No FPL count, and nothing the table
  above already counts (Craig, 11 Oct 2026). A different provider answering a
  different question, so it is the panel under ours and never a column in it. Below them an outfielder gets Opta's attacking
  figures on a plate headed **Attacking**, priced or not: shots, shots on target,
  big chances missed, touches in the box, chances created, big chances created,
  and accurate crosses and dribbles won as made of tried ("1/4"); then a plate
  headed **Defensive**: tackles won, interceptions, blocks, clearances, recoveries
  and aerials won. A keeper gets neither plate, and nor does a man Opta has no line for.
- **It never runs off the screen.** Its title bar carries a × and its foot Full profile
  and Close, both pinned, and only what is between them scrolls; the backdrop and
  Escape shut it too (Craig, 11 Oct 2026, a long story under the card).
- **Before he kicks off** there is no table: the fixture line under his name says
  when, and an empty breakdown under a live score would read as a score of
  nought.
- **Once he kicks off** the fixture line is his match: his crest, the score home side
  first (`MCI 2–1 IPS`), then the minute in the live colour while it runs, FT
  after. The difficulty chip goes: Sarr's red `BHA (A)` over `BHA 5–0 CRY` read as
  the result (review UX-10). A double's match still to come keeps its chip. Craig, 19 Oct 2026: a tap
  *"brings up no live points for the player/scores etc, just an empty card"*. A
  played man's card did carry his table (checked in WebKit and Chrome at 390 on
  GW7: Haaland, Leno, Kerkez, Sarr); what no card said was how his match stood,
  and a man still to play has only his kickoff.
- **A provider that will not answer never leaves it empty.** The production logs that match day show FPL 403s and
  Fantrax timeouts. While FPL's fixtures were held from before kickoff, the card waited for a whistle FPL never
  reported and drew name, fixture and kickoff over Fantrax's 10 points. Now Fantrax crediting him (a category or his
  minutes, `underway`) counts as kicked off, on the card and on the grass. A missing table says *No breakdown right
  now.* with Try again (a refresh); a match read that fails, hangs past 20 seconds or meets a deploy's old action id
  says *No match figures right now.* with Try again; one still out says it is getting them. The house's "right now"
  words, in muted ink: amber is a figure beside a name (review UX-9).
- The three states of `points` are three different sentences: no table at all is
  Fantrax refusing and says so, a table that does not name him is a dash, and a
  table that gives him a nought is a real nought.

## The points band

The bottom band of a player on the grass, and the loudest thing on the card
after his kit.

- **Once he has played it flips dark** — near-black ground, cream numerals, his
  chips beside them. It used to be a small number on the same cream as his name,
  which made the one figure a manager came for the smallest thing on the screen.
- **Until he plays it is his fixture**, `v COV (H)` as every fixture is written, never his club's short name:
  Craig, 19 Oct 2026, *"just show who he is playing"*, after the band had drifted to the club. A man with no match
  this gameweek is a dash. The same `PitchMarker` draws the Team tab's pitch and the FPL tab's, so both say it too.
- **Not-played is said by the kit alone** — dimmed and lightly
  desaturated. The whole card used to dim, which took the fixture colour and the
  name with it: the two things a waiting player still needs.
- Both states are the same fixed height, because a line whose cards stand at
  different heights stops reading as a line.

## Auto subs

Craig, 19 Oct 2026: *"on the live head to head we show an auto subbed icon? then sarr (my sub) goes to the back of
the bench, no number assigned to him, make it clear its auto sub"*. A starter whose football is done without a minute
gives way to the first reserve by bench number who has played or may yet and keeps the shape legal
(`league/autoSubs.ts`, the paper's rule; PLATFORM_NOTES, 19 Oct 2026). The scoreline counts the reserve; on the pitch
(`autoSubbed`):

- **The reserve stands in the starter's place**, his points under him, with a small swap chip at the card's top left
  in cyan, the derived reading's slot: the sub is ours until Fantrax makes it. The real match's ▲/▼ keeps the right.
- **The starter goes to the end of the bench** with no number, "Auto-sub" over him where the number and position were.
- **Each man's card says it in one line**: "Auto-sub: on for Sarr, who did not play." and "Auto-sub: did not play, so
  Kerkez comes on for him." A reserve still to play comes on provisionally ("…if he plays"), adding nothing yet.
- Once Fantrax has made the subs its board holds the new eleven, and the marks go.

## Who is still to play

**Under each name on the scoreline, one short line**: "2 to play", or "all played" while the round runs
(`toPlayWord`, the matchups list's words), from Fantrax's own `toPlay`, which names nobody and so passes a closed
gate. `ScoreRow` takes the same line under a name (`tieSide`'s `left`) for Live's tie rows. On the pitch, everyone who has
not kicked off is still **drawn back**, his strip carrying his fixture instead of a score: the line counts them,
the pitch names them (review M2, 16 Oct 2026: nothing on Live or the board said who still had men to play).

## States

- **Both sides open** — the live case, and the ordinary one once a period starts.
- **One side gated** — the ordinary case all week. A rival's eleven is not public
  until his period opens, so his half shows one sentence and a link to his squad
  page (which explains the reason properly). Your own is never gated.
- **No pairing** — a bye, or a schedule that has not reached its first
  head-to-head. A `Nothing` panel inside the league shell.
- **Scoreboard refused** — both totals read as dashes. The elevens are unaffected.
- **No such team** — 404. Fantrax silent, or no schedule at all — to that gameweek on
  `/league/fixtures`, which describes both (the Matchups list it went to was retired on 20 Oct 2026).

## Constraints

- **Accent means "your team" and nothing else.** The leader is deliberately not
  accent-tinted; whoever is ahead reads at full strength and the side behind is
  dimmed. A second meaning for accent breaks a reading aid five other screens
  depend on.
- **One number per side.** Pending clean sheets used to ride beside the total as
  a green `+n`. It is gone from here: a scoreline is the one place a reader
  expects a single figure, and a second one next to it — ours, provisional, in a
  colour that means something else on this very screen — asked him to do
  arithmetic Fantrax will do for him within the hour. `pendingByTeam` stays and
  the matchups list and `/matchday` still show it, where a card has room to
  label it.
- **A dash is not a nought.** A side Fantrax has no total for gets a dash, and
  nobody is "behind" while a total is missing.
- ~~The whole board — scoreline, controls, eleven and bench — fits a 390×844
  phone without scrolling.~~ **It does not, and had stopped before anyone
  noticed.** Measured 29 Aug: 899px against 844, and ~902 before the player card
  was rebuilt that day, so the claim was already stale by about the same amount
  and the rebuild is not what broke it. The card is not what is over — a squad
  drawing the identical eleven at `/squad/[teamId]` fits with 53px to spare.
  This board spends 471px on furniture the gated squad page spends 232 on: a page
  header, the section nav, a scoreline and a Pitch/List control, above the same
  pitch. The remaining 55px has to come out of those, and until it does this is a
  board that scrolls.

## Known gaps

- ~~The list does not separate the eleven from the bench.~~ **Closed 5 Sep 2026.**
  It was fed `squadUnarranged`, whose job is to REMOVE the arrangement — the right
  shape for a rival's squad before his period opens, and not what this branch is,
  since a withheld side never reaches it and the pitch beside it had been drawing
  the lineup all along. Both views draw the eleven in its formation lines, then a
  plated `Bench`, then the reserves.
- The two elevens can only be compared by switching halves. Whether that is worth
  fixing on a phone is an open question — the alternative is thirty players.
