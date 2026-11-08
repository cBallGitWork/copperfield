# Boards: the reskin proposal (7 Nov 2026)

**Approved 8 Nov 2026** (Craig: *"Yes"*): the four pictures moved to `docs/design/approved/league/` and
`docs/design/approved/squad/`, where they bind. This file stays as the record of how they got there.

Craig, 7 Nov 2026: *"propose a reskin that still honours CM 99"*. Two boards at 1440, drawn through the
`/design` loop: both lint clean (`tools/ui/designlint.mjs`) and were reviewed by the four-agent panel, whose
clear-cut findings are fixed below. The rest are Craig's calls.

| Board | Route | CM shots it borrows |
|---|---|---|
| [`LeagueTable.html`](../approved/league/LeagueTable.html), [`1440`](../approved/league/1440.png); [`390`](../approved/league/390.png) | `/league` | `cm9900/24.jpg` (the table, the caption plate, the Pts block) |
| [`Squad.html`](../approved/squad/Squad.html), [`1440`](../approved/squad/1440.png); [`390`](../approved/squad/390.png) | `/squad/me` | `cm9900/12.jpg` (the Inf column, the value block), `25.jpg` (the team's tabs) |

**The phone** (Craig, 7 Nov 2026: *"make sure mobile is looking good"*). Both boards at 390 by DESIGN §2's phone
rules: the rail along the foot with Live in it, 44px tabs, a strip's labels on their short word (`Stats`) so none
wraps, the table ending on `Pts` with short names and `Ag`/`Form` standing down, 44px rows where a row is tapped,
your own team's bar off the phone so the list has the room, the squad's complaint and return under the name, and the
opponent as club and h/a in 66px. Neither scrolls sideways; both lint clean.

## What the reskin changes

- **A. CM's sidebar head.** The rail opens as the game's does: the date block, the gameweek `◄ ►`, the deadline
  plate where `Continue Game` sat, then your team, then the sections (`cm9900/24.jpg`).
- **B. The desk fills 1440.** No 1152 frame beside the rail; CM's screen has no margin.
- **C. An indigo tab strip** under the royal-blue title bar, so the subject and its views are two objects in two
  colours, as CM draws them. A new token, `--color-tab`: ink 13.1:1, accent 10.0:1.
- **D. Column heads as separate grey plates**, CM's own (`24.jpg`, `12.jpg`), in place of one butted run.
- **E. The column a table is for in CM's purple block**: Pts on the table, FPts on the squad. A new token,
  `--color-for`: ink 10.8:1.
- **F. The squad's state, CM's way.** An `Inf` column for the mark (`12.jpg`), the complaint and the return in
  their own cells in place of `Knee · GW10`, and no position group rows.
- **G. The tells out** (DESIGN §10). Today's app has a `·` string in 71 files (106 joins, the cut label
  `£30 · picks semi opponent` among them) and 8 `rounded-full`s, portraits included; the reskin sweeps both.

## Fixed after the panel

- The squad board drew twelve starters; the league is 14/11/3, so it is eleven and a bench of three, numbered.
- Magalhães printed a return in the open week; a return prints only past it (`docs/ui/squad.md`).
- The four season cuts, dashed in the league's red, and the reader's row (raised ground, accent edge, `You`) are
  back, as `docs/ui/league-table.md` has them.
- Tables flush to the panel, so the spine meets its edge; tabs 56px; no head over the name column; crests, the
  doubt wash and FPL's expected day restored; a reserve's figures dimmed with his name; the date in ink, the
  arrows raised.

## Decided (Craig, 7 Nov 2026: *"Your call"*)

Craig handed the calls back; these are the recommendations, now drawn on the boards. A build PR lands each with its
token and DESIGN rows; nothing in the app changes until then.

1. **Purple for the column a table is for, everywhere** (`--color-for`): Pts, FPts, Proj and GW. It replaces FPts'
   cyan (21 Oct 2026); DESIGN §3's cyan row loses the league's points, and the purple row takes them.
2. **The indigo tab strip** (`--color-tab`); DESIGN §2's "royal-blue plates" becomes indigo under a royal-blue bar.
3. **A 1200px frame, centred**, the ground either side: CM's proportions, and the figures near the names. (It was
   full width until the fresh review below.)
4. **`◄ ►` only where a screen has a gameweek**: the Squad's rail has them, the season table's doesn't.
5. **A fixture tile is the club and h/a, and nothing else** (Craig, 7 Nov 2026: *"Stop adding numbers to the
   fixture tile, team and h/a"*). The difficulty is the tile's colour; its words, "difficulty 2 of 10", are the
   tile's title for a screen reader.
6. **A near-black team**: its bar takes its second colour as a bevelled plate (The Raccoons' white, black ink), and
   its index spine the league's blue, since a white spine read as column heads.
7. **A banned man's xMins stays `0`**: a known figure, not an absence.
8. **CM's foot bar**: grey `◄ Back` and the next screen on the League (`Cups ►`), the teams either side in the
   table on a Squad (`◄ Bru`, `Atletico ►`), as `cm9900/24.jpg` and `10.jpg` close every screen.

## The fresh-eyes review (7 Nov 2026)

A reviewer who had seen none of this judged the boards cold, as a site and as a CM tribute, against
`docs/ui/reference/cm9900/`. Craig: *"Your call"*. Taken: the frame (3), the foot bar (8), names that outrank the
figures (19px), the rail as bevelled plates with the date in yellow, the caption on CM's soft band and the photo
through the panel (80%), blue position plates (6), one `Inf` column for the mark and the word, no Club column beside
the crest, no `You` chip, readable cut labels, the deadline on the phone, and Live's own glyph.

Declined, as Craig's standing rulings: keys and legends ("people aren't stupid"), yellow cut lines (league red, so
yellow stays "yours"), renaming the phone's Read and Draft or dropping its glyphs, CM's `Inj` word chips in place of
the cross and card, and the fixture tile as text (it stays a filled tile, club and h/a). The rail and title
gradients CM draws were drawn and then taken out: the design lint fails them (DESIGN §10, 3).

## Doc drift the panel found

`docs/ui/league-table.md` still says there is no green form letter because `--color-up` is deferred; DESIGN §8
closed that on 29 Aug 2026 and the boards follow DESIGN. Its line 27 lists `Pts Form`; the desk's order ends on
`Pts`.
