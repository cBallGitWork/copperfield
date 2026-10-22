# `/league/waivers` — when claims run, and who claims first

When the league's waiver claims next run, the claim order, and what the last run gave (Craig, 19 Oct 2026: *"maybe a
banner and countdown when 18 hours left? maybe draft page needs a waivers section?"*). **The run days and the clock are
read off the league's setup, never written down here or in code**: the real league runs Wednesday, Thursday and Friday
at 1:00 PM US Eastern, the rehearsal and dummy leagues Tuesday and Friday at 5:00 AM.

`../rules/DESIGN.md` is binding for colour and type and this file defers to it.

## On the page

- Draft's frame (`league/Shell`), with **Transfers lit**: Waivers is a view of it, not a sixth tab (below).
- **Next run**: the London day, date and time, a countdown in the accent (`in 1d 2h`, `5h 12m`, `18h`), and the
  week's other runs, `Then Thu 18:00 · Fri 18:00`. It ticks to the minute on the phone's clock and moves on by itself
  once a run has gone (`NextRun`, over `useMinute`).
- **Claim on Fantrax ↗**, to the league's player list, where a claim is made. Claims are not made here.
- **Claim order**: 1 to 10, the league's table frame (`StandingsTable`) with an Order column and the team, yours in the
  accent. Read off Fantrax's own column, `wwOrder` on the standings page, **never derived from the table**: a claim
  sends its maker to the back and the order resets to reverse standings on its own day, so on 19 Oct the bottom
  team was tenth in it.
- **Last run**: the claims off waivers on the latest run's stamp, in Transfers' own ledger (`Ledger`), headed with
  the run's London time. Free-agent pick-ups are not a run and are left out.
- Under a thumb the order and the last run are one block at a time, picked by a compact strip (`?show=last`) docked
  in `FootFrame`'s foot above the thumb rail (20 Oct 2026); the desk shows both side by side and no strip.
- The claim order's head row is for a screen reader only: its one plate, Order, is muted, and drawn it was a blank
  grey box over the column (`StandingsTable` hides a head row with no figure in it).

## A view of Transfers under a thumb, its own plate on the desk

Draft's strip holds five plates and Craig ruled six too many on 13 Oct 2026 (`SectionNav`), and at 390 the five
already fill the row (shot of 19 Oct). Waivers is about transfers, so under `lg` it lights the Transfers plate
(its entry's `folds`) and Transfers carries the way in: the waiver line, all week, at the head of its ledger.
**From `lg` Waivers is a plate of its own after Transfers, and lit there** (Craig, 22 Oct 2026: the desk's bar
has the room); `TabStrip` draws Transfers once per width so each width has one current plate.
The other choices were a sixth plate, which would truncate at 320, or a second strip on Transfers, which is a row of
buttons more on a page that has none. Reversible: a plate in `SECTIONS` and the line's `always` would undo it.

## The banner

A slim line under the strip, linking here: **`Waivers run in 5h 12m · you're 9th`** (`WaiverBanner`, client
`WaiverCountdown`, words in `waivers/banner.ts`).

- **On every Draft page**, from 18 hours before a run (`WAIVER_BANNER_HOURS`), but this one, which says it already.
- **On both Transfers views it shows all week**, Draft's and the reader's own Team › Transfers, before the window and
  **even when the schedule is unreadable** or every run has gone, as `Waivers · you're 9th`, never the run's date (Craig,
  22 Oct 2026: *"remove the waivers run xx date, hate it"*) (or `Waivers` for a reader with no place), so Transfers always has its way in (`WaiverLine`). **Not on Team's other tabs**: over the planner it would cost the pitch its
  height and push the bench under the rail (`squad.md`, the pitch fits the phone), and a rival's squad is not where a
  claim is made.
- **Every run day opens it**: 18 hours before an 18:00 run is midnight London, so with Wed, Thu and Fri runs it is up
  from 00:00 to 18:00 on each of the three days (23:00 the night before to 17:00, the week the clocks disagree). A run day is a day claims CAN resolve, so it never says anything is waiting: other teams' pending claims are not readable
  (PLATFORM_NOTES, 1 Oct 2026).
- `you're 9th` only for a signed-in reader with a place; the countdown is the accent inside the window, ink before it.

## Clocks

The setup's clock has no zone in it; it is Fantrax's, US Eastern, like every stamp they print (`FANTRAX_TIMEZONE`).
Each run is placed by its own date's offset (`upcomingRuns`), so the week the UK's clocks have gone back and the US's
have not, 25 Oct to 1 Nov 2026, the runs are at **17:00** London, and 18:00 again from 4 Nov. Tested in
`packages/core/src/league/waivers.test.ts`.

## States

| Screen | State | What it says |
|---|---|---|
| Next run | no cookie in the environment, a refusal, or a league with no set run days | Nothing: the page opens on *Claim on Fantrax*; no banner but the Transfers line, without a time |
| Next run | every run carried has gone (a page open for days) | *No run to come* |
| Claim order | the standings page has no `wwOrder` column | *Nothing*: "No claim order" |
| Last run | no claim off waivers in the feed yet | *No claims off waivers yet* |

## The files

| File | Draws |
|---|---|
| `apps/companion/app/waivers.ts` | the schedule read (commissioner cookie, held 6 h) and `readWaivers` |
| `apps/companion/app/league/waivers/page.tsx` | the page |
| `apps/companion/app/league/waivers/NextRun.tsx` | the head, ticking |
| `apps/companion/app/league/waivers/WaiverBanner.tsx`, `WaiverCountdown.tsx` | the banner |
| `apps/companion/app/league/waivers/banner.ts` | its words, and the week's other runs |
| `packages/core/src/league/fantrax/waivers.ts` | `mapWaiverSchedule`, the setup's block |
| `packages/core/src/league/waivers.ts` | `upcomingRuns`, `nextRun`, `timeLeft` |
| `packages/core/src/league/fantrax/standings.ts` | `mapClaimOrder` |
| `packages/core/src/gazette/deals.ts` | `lastWaiverRun` |

## Known gaps

- **The calendar feed** (`/calendar.ics`) does not carry waiver runs yet; `upcomingRuns` is what it would read.
- **The order reset** (`waiverWireClaimOrderResetDays`, Tuesday 01:00 US Eastern in the real league) is not read or
  shown: the order printed is Fantrax's own at the moment of reading, which is what a claim goes by.
