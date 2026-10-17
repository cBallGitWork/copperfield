# `/matchday` — the live centre

The tab is called **Live**, and it exists from an hour before a gameweek's first
kickoff until its last whistle (`LIVE_LEAD_MINUTES`; Craig, 8 Oct 2026: *"build
the hype"*). The order is the order a manager cares about: your head-to-head
first, the real football under it.

**The hour before kickoff is the build-up**, not "No football today": the same
board, every tie at nought, today's fixtures at their kickoffs, and under the title
the minutes to go and, while it is ahead, the lineup lock as a link to your team,
whose phone tab Live has taken. Opening the app in that hour lands on Live, and the
page polls at the live rate. Replay reads the round ahead from the same hour, as FPL
turns its round 90 minutes before the first kickoff.

**Scores carries the goals** (16 Oct 2026, the review's 15:50 test: "who scored" took a tap):
under each Premier League row with a goal, home's down the left and away's down the right,
oldest first, `Haaland 65′ AS Doku`, a penalty `pen` and an own goal `og` under the side it
counts for; the reader's men are in the accent. Off the vidiprinter's own join (`fixtureGoals`
over `wireLines`), so the two views cannot disagree. Scores stays the landing view and the
football stays first (Craig, 21 Sep 2026). **Each tie side says its men still to play** under the
name, `2 to play` or `all played` (`toPlayWord`, as the head-to-head board prints it).

**The wire's names come off the team sheets too** (`roundCodes`): the bridge is harvested by
hand (`npm run pl-bridge`) and lagged a month by GW6, when 6 of 36 scorers printed `—`.

## On the page

1. **No matchup row** (Craig, 11 Oct 2026: *"remove the bigger match row, we can already see the row anyways
   further down"*): your tie is the Scores list's own row; `YourMatchup` is gone.
2. **`Afternoon`** — your **active** players still to come, grouped by kickoff:
   `Sat 15:00 · Gabriel, Saka` / `Sun 14:00 · Isak`, with a live group showing
   the clock instead of the time. The card above says where you are; this says
   what is left to change it. Reserves are excluded because they do not score,
   and reading your own lineup withholds nothing from anybody — it is yours all
   week. Absent for a signed-out reader, and it renders nothing at all.

   **The day is printed, and "afternoon" is the name rather than the scope.**
   These examples used to be `15:00` and `17:30`, which is what a round looks
   like if you only ever picture a Saturday. GW1 ran Friday night to Monday
   night and the strip read `15:00` above `14:00` — right, because one was
   Saturday and the other Sunday, and unreadable, because it said neither.
3. **`Wire`** — Sky's teleprinter, with the ownership on it. Craig, 5 Sep 2026,
   with a still of Soccer Saturday: *"the wire should mock Gillette Soccer
   Saturday a little like this. Have the minute in brackets rather than the blue
   tab. Wire should also include half and full time."* Sky runs `GOAL   LEEDS 1
   BRISTOL CITY 0   LUKE AYLING (16)`; ours keeps the word and the man, puts the
   minute in brackets after his name, and spends the middle of the row on the
   sentence no score centre in the world prints — the manager who holds him.

   **The minute left CM's blue index block for those brackets.** The block was a
   royal-blue plate down the left of every row restating a number that belongs to
   the name beside it, and it was the loudest object on the panel. A wire is read
   down the names.

   **A manager's bracket wraps under his man, never cut** (review M4: 12 cut on 11
   lines at 390). The brackets are already short names, so only a wrap saves them.

   **`FT` rows carry the scoreline**, interleaved by wall clock like everything
   else, because full time is the one thing a scoreline cannot say about itself: a
   2-1 with a clock on it and a 2-1 that is finished look identical. `FT` is
   amber (`--color-mid`, a fact and a ledger line) since Craig's *"FT should be
   yellow, grey bad"* (1 Oct 2026): not the accent, which means "yours" on this
   very panel, nor `--color-live`, which means a match in PLAY. Off the SAME
   cached round read as the goals — one upstream request for ten matches.

   **One face for the whole line** (1 Oct 2026): the chrome face for the word,
   the names, the minute and the managers, names a step up. The minute and the
   manager are ink: a name is white, and yours is the accent. The assister is
   marked `As`, not `Assist`, so his manager fits at 390 (Craig, 2 Oct 2026:
   *"Could just put 'As'"*).

   **Half time was here for an evening and went** (Craig, 5 Sep 2026: *"ditch the
   HT"*). On a Saturday teatime it lands within an hour of full time with the
   scoreline unchanged between them, so the wire drew `HT HUL 0 v AVL 0` directly
   under `FT HUL 0 v AVL 0` — ten fixtures would have been twenty rows of
   furniture between the goals. The derivation that fed it went too: the Premier
   League publishes `halfTimeScore` on its per-fixture DETAIL read and not on the
   round one (0 of 10, counted 5 Sep 2026), which is still worth knowing and is
   why the score had to be counted off the goals rather than read.

   **Two versions, behind a `Rows · Report` strip.** The second is Opta's own
   prose, shortened — see `roundCommentary`. It carries the VAR-cancelled goal and
   the man who won a penalty, which the row wire has no source for, and it loses
   the ownership, which is the row wire's whole reason for existing. A temporary
   object: the loser is deleted rather than kept behind a flag.
4. **`GameweekView`** — the round's fixtures (see [gameweek.md](gameweek.md)),
   now with **your players marked and every scorer tagged with the squad holding
   him**. The two halves of the page finally share both grammars: the scoreline,
   and the accent mark that means "yours".

**Top stats**, the third view (`?view=stats`; Craig, 1 Oct 2026: *"match day have 3rd tab, that
shows top stats for just this gameweek, like xg, fpts, ratings etc"*): the gameweek's ten leaders in
Fantrax points, the DefCon count (defenders, then midfielders and forwards together; no keeper list,
as the league counts no keeper DefCon), xG and xA, each man with whoever holds him. Craig, 11 Oct
2026: *"show top 10 and free agents too. Remove rating tab, replace with top mid/forward/def
defcon"*, then *"Just group defcon mid and forward together. Use the actual value, not the points."*
The phone picks one list from a strip (`Points · DefCon D · DefCon M/F · xG · xA`, `&stat=`; DefCon is its one name on every screen, with the slots it counts, 16 Oct 2026, review N30); a desk shows
all five, three across.

- **Each list is the Data tab's `LeaderBoard`** ([prem.md](prem.md)), with no `Top 50` plate: the
  same head, places shared by men level on the figure printed, crest, name linking to his page,
  amber for every figure, all of them recorded.
- **Who holds him is the Data boards' `Holder`**: `(Yours)` in the accent, a rival's short name quiet,
  and nothing for a man on no roster: an owner prints only where there is one (16 Oct 2026, the review's
  "Henderson (FA)"). The name keeps whole and the bracket truncates.
- **Fantrax points**: a rostered man's are the live read's, at the slot his manager chose, eleven and
  reserves in one list; a man on no roster's come from the served league's pool for the period
  (`getPlayerStats` `BY_PERIOD`, `pool-period-points`), Fantrax's own figure. Counted 11 Oct for GW6:
  173 men on points, 97 of them on waivers, the period's top scorer among them.
- **The DefCon count** (`DC`) is the stats league's own count for this gameweek's period, never
  points and never FPL's: the category the league's scoring (the `scoring` league in `recorded.json`)
  counts at each position, so the lists group the positions that share one, DFP at the back and DFP3
  in midfield and up front. A rostered man stands on the list holding his slot, a man on no roster on
  every list whose positions he may play, so a two-position free agent can stand on both, each with
  that list's count. A double gameweek's count is both matches'.
- **xG and xA** are FPL's round figures, read once per man, for everyone who played.
- The rating list went on 11 Oct; the season's marks are still a Data tab list.

Last, on every view, **The desk** ([desk.md](desk.md)), then **Matchups on Fantrax**: their live scoring for this gameweek's period
(`livescoring;period={n}`, `FANTRAX_MATCHUPS_PATH`), or their current period when we could not
read ours (Craig, 1 Oct 2026: *"have fantrax link at bottom which goes to the match ups screen"*).

Between rounds, the football half is replaced by a panel naming the coming gameweek's
lineup lock while it is ahead (`lockAhead`, off the league's roster periods, handed to the
panel as plain data), and the first kickoff when the league gives no lock. FPL's deadline
went on 12 Oct 2026; the lock took its place on 16 Oct (the review: Friday's Live said
"starts Sat 12:30" and never "lock 12:15").

**When a live-score read fails**, Live keeps the last good head-to-head scores, and each
draft section's head says `as of 15:47` once they are older than the present tense
(`takenLately`); current scores print no time (16 Oct 2026, the review's M5).

## The gap this page had

**The head-to-head board is one tap away** from your tie's row in Scores ([matchup.md](matchup.md)).

Live goals, assists and bonus still cannot be faked without inventing football,
so every state below the layout ones waits on 21 Aug.

## Known gaps

- Real scroll length is unmeasured — three panels now, and only a live Saturday
  says whether the afternoon strip earns its place above the football.
- A group of simultaneous kickoffs carries one clock, the highest minute in the
  group. The strip is a glance, not a stopwatch.
