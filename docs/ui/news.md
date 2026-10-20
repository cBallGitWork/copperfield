# `/news` — Mail, the manager's inbox

What happened in our league, newest first, as CM's news screen files it (`docs/ui/reference/craig/02-news.jpg`):
a dated list, the open letter beside it on a desk, one at a time on a phone. **Mail keeps every league transfer,
named by the league's short team names** (Craig, 16 Oct 2026: *"but use short team names"*). It reports and never
advises; its one read of its own is the scout's xMins (`core/inbox/types.ts`).

`../rules/DESIGN.md` is binding for colour and type and this file defers to it; its Mail paragraphs (§2) govern the
label and the unread count. **Mail draws no bar** (Craig, 19 Oct 2026: *"remove the 'raccoons mail section' already
too many buttons"*): Read's strip sits straight over the Fantrax button and the list, and the page's heading
(`123 Mail`, `Mail` signed out) is screen-reader only. This supersedes the `123 News` bar of 5 Sep 2026, DESIGN §2's
one granted exception.

## On the page

- Read's strip (`news/layout.tsx`), Mail lit, and no bar under it; the `sr-only` heading names the reader's team,
  `Mail` alone signed out.
- On the list only, a button to the reader's pending claims and trades on Fantrax.
- The list (`news/Mailbox`, `news/MailRow`): the London day and time in CM's blue block, the headline, a doubt's
  `INJ`/`DBT` box, and whose item it is (`You`, or the short name) unless the headline already names the team.
- The letter (`news/Letter`): From, Subject in the accent, Date, Squad for an opponent's man, the body, and at most
  one button. A deal's body links each man to his page and each team but yours to its squad (19 Oct 2026).

## What it files

`core/inbox`, each builder from its own source, merged by `inboxItems`, which sorts by date, newest first:

| Letter | Dated by | Button |
|---|---|---|
| The next lineup lock | the lock | `Your team`, signed in |
| Your gameweek result, one per tie | the gameweek's last full time: its last kickoff plus `FULL_TIME_AFTER_KICKOFF_MINUTES` | `Head-to-head`, at that gameweek |
| A doubt, yours or your next opponent's (everyone's signed out) | FPL's news date (17 Sep 2026) | the man's own page, under his name |
| Every claim, drop and trade in the league | Fantrax's stamp | none |
| A trade block, an offer to or from you | its save, its proposal | none |
| The scout's xMins moves | the export | none |
| A Team Sheet column | its filing | `Read the article` |
| A story about your team, signed in: one per tie | its filing | `Read the article`, at the tie's section where it has one |

An undated item (a doubt FPL never stamped, a result with no calendar) falls to the foot. Until 16 Oct 2026 the
result was always undated, and sat 44th of 44 (review N1).

## The paper about you

A story files a letter to each manager its own cargo names (Craig, 19 Oct 2026: *"yes sure"*), so the paper about
him moves the unread count as the Team Sheet already did (`core/inbox/paperLetters.ts`, LOOPS-2). The team comes
from the story's data, never its prose: the draft report's match-ups (`The Gazetta on your win over Bannan`, linking
`#d-N`), the predictions' ties (`The Gazetta backs Hazza to beat you`), Here We Go's receiving side (`The Gazetta on
your signing of Jeremy Doku`) and the power rankings (`The Gazetta ranks you 3rd`). A story that names every team
writes each reader his own tie, two in a double header. The Bin XI and the Prem reports name no team as data and
file none. Counted on the archive on 19 Oct 2026: at most 3 a week per reader (Dome's week of 12 Oct), 2 for the rest.

## Short names, said once

Every letter names a team by `data/leagues/short-names.json` (`Dome sign Marco Palestra (CHE)`, `You beat Hazza in
gameweek 6`); the bar keeps the full name. The row's owner tag stands down when the headline already carries the
team as a word (`news/owner.ts`), so a signing no longer reads `domeitalycoach sign …` beside `DOME`. Measured on the
16 Oct capture, the longest of 32 deal headlines is 38 characters, against 51, inside `MailRow`'s two lines at 390.
A club in a headline is spelt as every other screen spells it: Fantrax's `BRF` and `NOT` go through identity's
`toFplClubCode` to `BRE` and `NFO`.

## A doubt names its gameweek

The letter says which gameweek the doubt bears on (*"is a doubt for gameweek 7"*), never *"the next gameweek"*, which
read wrong under a letter dated in August (review N31). The row keeps FPL's date, and a note filed before the last
lock keeps a headline with no gameweek (#388), so the list never prints `GW7` beside `Fri 14 Aug`. An unnamed injury
drops out of the sentence: *"He has an injury."* said nothing the box does not.

## The way back

A phone's letter sits under `← All mail` (`news/ListBack`): it steps Back when the list is the page behind, so Back
never reopens the letter, and puts the list in the letter's place for one opened cold (`news/listStep.ts`).
`news/KeepScroll` puts the list back where it was: the browser's own restore lands while the short letter is still
drawn and clamped it to the top (review M13, 800 → 0). Both sit in `Mailbox`, so a player's News tab has them too.

## States

| Screen | State | What it says |
|---|---|---|
| `/news` | nothing filed | *Nothing filed*, `0 items` |
| `/news` | signed out | the whole league's doubts, no lock button, no offers |
| `/news?item=` | an id no longer in the inbox | the list on a phone, the newest letter on a desk |

## Known gaps

- Only a deal's body links its names: it carries them as `mentions`, each with its id, and `core/inbox/mentions`
  cuts the body at each (review N2, LOOPS-3). The xMins letter names eight men and links none.
- A paper letter lasts as long as its story is in `paper.json`, as a Team Sheet column's does; an archived story leaves
  Mail. Here We Go writes only to the side the lead man joined; the other side has its deal letter.
- `KeepScroll` keys on the Navigation API's entry; a browser without it keeps no place.
