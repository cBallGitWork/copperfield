# Boards: the reskin proposal (7 Nov 2026)

Proposals, not decisions. Nothing here binds a screen until Craig says yes and it moves to
`docs/design/approved/` (`.claude/skills/design/SKILL.md`, step 7).

Craig, 7 Nov 2026: *"propose a reskin that still honours CM 99"*. Two boards at 1440, drawn through the
`/design` loop: both lint clean (`tools/ui/designlint.mjs`) and were reviewed by the four-agent panel, whose
clear-cut findings are fixed below. The rest are Craig's calls.

| Board | Route | CM shots it borrows |
|---|---|---|
| [`LeagueTable.html`](LeagueTable.html), [`1440`](LeagueTable-1440.png); [`390`](LeagueTable-390.png) | `/league` | `cm9900/24.jpg` (the table, the caption plate, the Pts block) |
| [`Squad.html`](Squad.html), [`1440`](Squad-1440.png); [`390`](Squad-390.png) | `/squad/me` | `cm9900/12.jpg` (the Inf column, the value block), `25.jpg` (the team's tabs) |

**The phone** (Craig, 7 Nov 2026: *"make sure mobile is looking good"*). Both boards at 390 by DESIGN §2's phone
rules: the rail along the foot with Live in it, 44px tabs, a strip's labels on their short word (`Stats`) so none
wraps, the table ending on `Pts` with short names and `Ag`/`Form` standing down, 44px rows where a row is tapped,
your own team's bar off the phone so the list has the room, the squad's complaint and return under the name, and the
opponent with his rank in 66px. Neither scrolls sideways; both lint clean.

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
3. **The desk fills 1440**; the paper keeps its frame, and the name column is capped (360px on a table, 300 on a
   squad) so the figures stay near the names.
4. **`◄ ►` only where a screen has a gameweek**: the Squad's rail has them, the season table's doesn't.
5. **The opponent's rank is printed** beside his code, so colour never carries difficulty alone.
6. **A near-black team takes its second colour** for the bar and the index spine: The Raccoons' bar is white with
   black ink, CM's own competition plate (`cm9900/24.jpg`).
7. **A banned man's xMins stays `0`**: a known figure, not an absence.
8. **No foot row**: the docs name none, so the ground shows under the panel, as `cm9900/09.jpg` does.

## Doc drift the panel found

`docs/ui/league-table.md` still says there is no green form letter because `--color-up` is deferred; DESIGN §8
closed that on 29 Aug 2026 and the boards follow DESIGN. Its line 27 lists `Pts Form`; the desk's order ends on
`Pts`.
