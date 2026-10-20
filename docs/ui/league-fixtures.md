# `/league/fixtures` — one gameweek, every competition on it

The season, a gameweek at a time: fixtures to come, results once played. **We never generate a fixture list** — who
plays whom in the league is a commissioner setting like everything else in the
league layer, and comes from Fantrax's own description of the competition.

Same `LeagueShell` frame as the table.

## On the page

**One gameweek, two arrows**, since 13 Oct 2026. Schedule and Results were two
tabs of the same thing, and Mail stacked three rows of blue buttons; Craig chose
one Fixtures tab stepping a gameweek at a time over one long scroll. It opens on
the latest gameweek under way (`openGameweek`), so Saturday's reader lands on the
scores, and **on the next once that one is done** (Craig, 16 Oct 2026), so
Friday's lands on the weekend to come and its deadline; `?gw=` names any other. The arrows flank
the round's head (`shell/RoundHead`'s `step`) and step over a break's missing
week (`beside`) and over any gameweek with no tie on (`onTheCard`): the
calendar runs from Gameweek 1, the real league's pairings from Gameweek 6, and ◀
walked into five empty weeks each headed "Full time" until 16 Oct 2026. This replaces the scrolled schedule of 5 Sep (*"Dont
show all the grey arrows here"*), which was a filter row, not a stepper; the team
picker's view stays at `/squad/[teamId]/fixtures`.

Under each round's head, the ties, boxed by competition. Each tie is **one row**:
both sides by name and the score between them, the way a results page
prints a football match.

**Your tie first** in each block (`fixtureTies`), and in the gameweek in play a `+n` beside a side's name for the
clean sheets Fantrax has not credited yet (`league/Pending`, through `ScoreSide.pending`), with one key line above
the head while any is owed. League ties only, never a cup's. Both came from Matchups, which folded into this page on
20 Oct 2026 (Craig); `/league/matchups` 308s here with its `?gw=`. The panel reserves the gameweek's own ties and its
head, not the table's ten rows.

A round still to come shows **`test4 v test2`, never `0 – 0`**. Fantrax answers 0
for every unplayed period, and printing it against a date in March states a
result for a match nobody has played.

A finished gameweek prints Fantrax's settled totals (`getSeasonResults`, one
cached read for the season) and dims the loser. A gameweek in play costs one
live scores request; one to come costs none, since Fantrax answers every unplayed
period with nought.

### The head names the ROUND, and then the deadline

`shell/RoundHead` — the same strip the Prem's fixture list heads its round
with, so the two cannot disagree about what a round is called.
It said DEADLINE and a date and nothing else until 7 Sep 2026, which names the
moment and not the round: a reader scrolling a season had to count Saturdays to
work out where he was, while Results, then one tab away, headed every block
`Gameweek 4`. Craig: *"this doesnt actually show what gameweek it is"*.

The deadline goes once the gameweek starts: a lock already passed tells a
reader of results nothing. The date came down to `londonDayAndDate` in the same change — "Saturday 12
September" spelled out took 60% of a 390px plate on its own, and the round's
name now shares it.

### The date is the deadline

Not the first kickoff. It comes from `locksAt` — **fifteen minutes before the
round's first kickoff**, which is the league's own setting, read off the
commissioner's settings page: `lineupLockType` is "Set amount of time before 1st
game of period" and `lineupLockTimeBeforeGame` is 0:15. Shared with the paper's
masthead so the two cannot print different times.

Measured back from the **kickoff**, never from the period boundary — those are a
day apart whenever the gameweek has no Friday night match. Gameweek 6, the real
league's first, locks **Sat 10 Oct 12:15**.

### Where a tap goes

Depends on whether the football has happened:

| Round | Tap |
|---|---|
| Any football played | the whole row → `/league/matchups/[teamId]?gw=N` |
| To come | each side → `/squad/[teamId]` |

**League ties only.** The head-to-head route resolves its pairing from Fantrax's
league schedule and knows nothing about competitions, so a cup tie would land on
the league fixture those two happened to have that week.

A round still to come has no score and no eleven anyone may see, so the squad is
the only useful destination. The board opens on the reader's own side when he is
in the tie, else on the home side.

"Any football played" is `ScheduleRound.started`, and it is deliberately **not**
derived from the round's status: a Saturday evening with nine results and a
Monday match left is `status: "upcoming"` — right for a caption, and fatal if
read as "no ball has been kicked". See `gameweekStarted`.

### The vocabulary is gameweeks, never periods

Fantrax scores in periods and is queried in them. The translation happens once,
in `schedule.ts`, through `periodGameweeks()` — the seam between the football and
league layers, and it still runs one way only. Both numbers used to be on screen
and they are the same number all season.

### Competitions

`league/competitions.ts` gathers them. The league's own ties are Fantrax's
pairings. The two cups are ours, declared in `league/cups/declared.ts`: the
Timbeibs Cup (GW10 to GW17) and the Davy Propper Cup (GW22 to GW30). The playoff
is Fantrax's, so it arrives in Fantrax's own pairings.

Nobody is drawn into a cup yet, so every cup side is a placeholder and the block
says so: "Seed 7", a group slot "A1", a group place "2nd B", or "Winner M5". This
is the cups' only fixture list (Craig, 1 Oct 2026: *"just put fixtures in fixtures
section"*); `/league/cups` keeps the brackets, where M5 is numbered. A cup seeded
on a gameweek's points says so under that gameweek's ties (GW9, Timbeibs Cup).

The number beside a cup tie is that gameweek's Fantrax total — a cup over fantasy
points is scored by the week's points.

## States

- Fantrax silent — `getLeagueInfo` refused, and only that read is fatal here. A
  table we cannot read costs the blue place blocks.
- A calendar whose periods hold no gameweek at all.
- No gameweek with anything on: no league pairings (every day until 10 Oct) and no
  knockout round. Only then does a round with no tie draw; otherwise it is off the arrows.
- A tie side nobody holds yet: the place or the phrase, in italic.
- A fixture list with no fixtures: that team is paired with nobody, or is not in
  the competition on screen.

## The files

| File | What it is |
|---|---|
| `../fixtures/page.tsx` | The route: which gameweek, its points, and the empty states. |
| `../fixtures/roundTies.ts` | A gameweek's ties, the reader's first, and the gameweeks that have any. |
| `schedule.ts` | The four provider reads, and the season's results on their own. |
| `RoundHeader.tsx` | What this screen adds to `shell/RoundHead`: the deadline, and whether the round is live or done. |
| `Tie.tsx` | One scoreline. |
| `Season.tsx` / `teamSeason.ts` | One team's whole season — the view, and the rows. |

## Known gaps

~~The full-time treatment is written and unwitnessed.~~ Witnessed 22 Aug: six of
GW1's ten fixtures finished with the schedule on screen, the winner marked and
the scoreline printed from `getStandings`. What is still unwitnessed is a
*completed period* — every dated fixture finished — which arrives Mon 24 Aug.

**A played head-to-head shows the rosters that were fielded.** Settled 28 Aug in
two halves: a claim proved Fantrax versions squad MEMBERSHIP per period, and a
lineup move later the same day proved it versions `status` — the only field the
lineup gate withholds. `squads.ts` now asks for a past period through
`frozenPeriod`, which requires both that Fantrax's own label has moved past it
and that our calendar says its lineups locked. The board says which of the two it
is holding.

**No provenance line.** Craig removed it on 20 Aug, and since 12 Oct 2026 no page
carries one: a screen never names its source (`docs/ui/README.md` principle 2).
