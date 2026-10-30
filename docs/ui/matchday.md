# `/matchday` — the live centre

The tab is called **Live**, and it exists from two hours before a gameweek's first
kickoff until its last whistle (`LIVE_LEAD_MINUTES` in core's config; Craig, 30 Oct
2026: *"activates 2 hours before kick off for first game of the gameweek"*, after an
hour since 8 Oct: *"build the hype"*). The order is the order a manager cares about:
your head-to-head first, the real football under it.

**Which gameweek Live shows is the league calendar's, not FPL's** (`liveGameweek`, read by
`liveNow`): the last whose first kickoff, less the lead, has passed. FPL turns its own round
at its deadline, 90 minutes out, so for the half hour before that Live reads the coming round
by number, and the draft's ties for its period. The rail's Live tab, the cold open's landing,
the rail's score and the share picture all read the same `liveNow`.

**The two hours before kickoff are the build-up**, not "No football today": the same
board, every tie at nought, today's fixtures at their kickoffs, and under the title
the minutes to go and, while it is ahead, the lineup lock as a link to your team,
whose phone tab Live has taken. Opening the app then lands on Live. Replay turns its
round at the same instant.

**Scores shows one match day at a time, with arrows to the others** (Craig, 19 Oct 2026: *"live scores
shows the days games, why dont we have a back/forward arrow for each day so you can access?"*). Under the
Premier League section's head, `‹ Sat 18 Oct ›` steps through the London days the gameweek has matches on
(`matchDays`, `dayStep`); it opens on today when there is football today, else the next match day, else the
last, and `?day=2026-10-18` names any other. An arrow at either end of the gameweek is an inert outline. Each
day's goals follow it. The draft's ties below stay the gameweek's. With no match dated, the gameweek shows
whole and no arrows are drawn. Until then today's matches showed, or the whole gameweek when today had none
(Craig, 5 Sep 2026).

**Scores carries the goals** (16 Oct 2026, the review's 15:50 test: "who scored" took a tap):
under each Premier League row with a goal, home's down the left and away's down the right,
oldest first, `Haaland 65′ AS Doku`, a penalty `pen` and an own goal `og` under the side it
counts for; the reader's men are in the accent. Off the ownership join (`fixtureGoals` over
`wireLines`). Scores stays the landing view and the football stays first (Craig, 21 Sep 2026). **The reader's own tie leads the league list** (19 Oct 2026, the
behaviour review: on a six-match Saturday it was the last of five rows, below the tab bar); the rest keep
Fantrax's order, and a signed-out reader sees that order unchanged (`readerFirst`). **Each tie side says its men still to play** under the
name, `2 to play` or `all played` (`toPlayWord`, as the head-to-head board prints it).

**`Share the scores` sends the league list as a picture** (Craig, 19 Oct 2026: *"share button or screenshot to
capture the list of all matches, i use that more"*). One plate under the draft's ties, while Scores shows them.
On a phone whose share sheet takes a file (`navigator.canShare({files})`, the iPhone) it opens the sheet with
`draft-gameweek-7.png`; anywhere else, or if the sheet fails, the picture opens in a tab to be held and saved.
`/matchday/share.png` draws it (`shareList` lays it out, `shareListCard` paints it): the gameweek, `as of 15:52`
while the scores can move, `Full time` once the football has stopped and `Final` at FPL's sign-off, then every
tie as Live lists it, the short name, the place, the score off Live's own read and `2 to play`; the dash for a
total not given. The league's order, with no side in the accent: it goes to the whole group, so it is the same
picture for every reader and caches for 30s. 780px wide, as tall as its rows, so a cup week grows it. No source
is named on it.

**The scorers' names come off the team sheets too** (`roundCodes`): the bridge is harvested by
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
3. **`Vidiprinter`**, the second view (`?view=vidiprinter`; Craig, 30 Oct 2026, reversing the 19 Oct drop): one
   match day at a time with Scores' arrows, newest first. Every match's kick-off, half-time and full time with the
   score; every man's goals, assists and red cards, drafted or not; a drafted man's bookings and changes, and the
   counts of every category the league scores, in its own words and never as points. Counts carry no minute, so they
   ride on his change, under the full-time whistle, or with the dash at the head of a match still in play. The
   reader's men are in the accent and every drafted man carries his holder. Off `vidiprinter` over `sheetMoments`
   (PLATFORM_NOTES, "Live has a vidiprinter again"). Live's strip is `Scores · Vidiprinter · Top stats`.
4. ~~**`GameweekView`**~~ — **gone 20 Oct 2026**: Live had stopped embedding it, and `/gw/N`, its one
   user, now redirects to Prem › Fixtures at that gameweek ([prem.md](prem.md#fixtures)). Between rounds,
   Live's two buttons lead there through `gameweekHref`.

**Top stats**, the third view (`?view=stats`; Craig, 1 Oct 2026: *"match day have 3rd tab, that
shows top stats for just this gameweek, like xg, fpts, ratings etc"*): the gameweek's ten leaders in
Fantrax points, the DefCon count (defenders, then midfielders and forwards together; no keeper list,
as the league counts no keeper DefCon), xG and xA, each man with whoever holds him. Craig, 11 Oct
2026: *"show top 10 and free agents too. Remove rating tab, replace with top mid/forward/def
defcon"*, then *"Just group defcon mid and forward together. Use the actual value, not the points."*
The phone picks one list from a strip (`Points · DefCon D · DefCon M/F · xG · xA`, `&stat=`; DefCon is its one name on every screen, with the slots it counts, 16 Oct 2026, review N30), docked
in the foot above the thumb rail (`FootFrame`, 20 Oct 2026: a sub-view switches from the foot, while
`Scores · Vidiprinter · Top stats` stays the one strip on top). The frame is only as tall as its board, because the bar and
`Matchups on Fantrax` sit outside it: under a short board the strip sits straight below the ten men with the exit
under it and nothing scrolls, and it docks on the rail only when a list runs past the screen. A desk shows all five, three across.

- **Each list is a `matchday/LeaderBoard`**, Prem › Data's own until that page went (19 Oct 2026): the
  same head, places shared by men level on the figure printed, crest, I. Surname by the one rule
  (`fullFootballerName` through `PlayerName`, not FPL's web name: D-12, 21 Oct 2026) linking to his page,
  CM's mark for an unfit man (`FitnessMark`) then who holds him, amber for every figure but FPts, which
  is the reading cyan, all of them recorded.
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

Last, on every view, **Matchups on Fantrax**: their live scoring for this gameweek's period
(`livescoring;period={n}`, `FANTRAX_MATCHUPS_PATH`), or their current period when we could not
read ours (Craig, 1 Oct 2026: *"have fantrax link at bottom which goes to the match ups screen"*).

Between rounds, the football half is replaced by a panel naming the coming gameweek's
lineup lock while it is ahead (`lockAhead`, off the league's roster periods, handed to the
panel as plain data), and the first kickoff when the league gives no lock. FPL's deadline
went on 12 Oct 2026; the lock took its place on 16 Oct (the review: Friday's Live said
"starts Sat 12:30" and never "lock 12:15"). The panel's head is only "No football today": the
sub line already says `Final`, so it does not say the week is done a second time, and the line
ends on the time with no full stop, keeping "Gameweek N" when it names the next week (20 Oct 2026).
Before a gameweek, "Who plays whom" opens League › Fixtures for that gameweek.

**Every draft score counts the auto subs** (`liveScores`; Craig, 19 Oct 2026: GW7's Raccoons read 34, not
Fantrax's 31, with Kerkez on for Sarr): one figure per side, the one the head-to-head prints ([matchup.md](matchup.md#auto-subs)).

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
