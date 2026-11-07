# Boards: the reskin proposal (7 Nov 2026)

Proposals, not decisions. Nothing here binds a screen until Craig says yes and it moves to
`docs/design/approved/` (`.claude/skills/design/SKILL.md`, step 7).

Craig, 7 Nov 2026: *"propose a reskin that still honours CM 99"*. Two boards at 1440, drawn through the
`/design` loop: both lint clean (`tools/ui/designlint.mjs`) and were reviewed by the four-agent panel, whose
clear-cut findings are fixed below. The rest are Craig's calls.

| Board | Route | CM shots it borrows |
|---|---|---|
| [`LeagueTable.html`](LeagueTable.html), [`1440`](LeagueTable-1440.png) | `/league` | `cm9900/24.jpg` (the table, the caption plate, the Pts block) |
| [`Squad.html`](Squad.html), [`1440`](Squad-1440.png) | `/squad/me` | `cm9900/12.jpg` (the Inf column, the value block), `25.jpg` (the team's tabs) |

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

## Craig's calls

1. **Purple for the column a table is for (E)?** It reverses *"put fpts in cyan too"* (21 Oct 2026) and reaches
   every FPts list. Options: purple everywhere; purple for Pts only, FPts stays cyan; or keep cyan. Recommended:
   purple everywhere, as CM's value block is one object.
2. **Indigo tabs (C)?** Amends DESIGN §2's "royal-blue plates". Recommended: yes.
3. **Full width (B)?** The desk only; the paper keeps its frame. Recommended: yes, with the name column capped as
   drawn.
4. **What `◄ ►` steps.** A desk-wide gameweek (new state), only on screens that have one, or drop it.
   Recommended: only where a screen has a gameweek; a label elsewhere.
5. **The opponent's difficulty.** Five full colours as drawn, the rank printed beside the code, or one hue in
   steps. Recommended: print the rank, as the planner does.
6. **A black team.** The Raccoons' colour makes a black bar and a black spine that vanish on the ground.
   Recommended: a team whose colour is near black takes its second colour for the spine.
7. **A banned man's xMins**: `0` as drawn, or `—`. Recommended: `0`; it is a known figure, not an absence.
8. **The empty foot.** Both boards leave the ground showing under the panel, as `cm9900/09.jpg` does. A CM foot
   row of related screens over `Back`/`Next` would fill it; the docs don't name one, so it isn't drawn.

## Doc drift the panel found

`docs/ui/league-table.md` still says there is no green form letter because `--color-up` is deferred; DESIGN §8
closed that on 29 Aug 2026 and the boards follow DESIGN. Its line 27 lists `Pts Form`; the desk's order ends on
`Pts`.
