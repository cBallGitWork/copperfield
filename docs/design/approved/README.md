# Approved pictures

Each desk screen Craig has approved has a folder here, and its picture binds that screen's layout
(`.claude/rules/register-palette.md`, Approved pictures). The values stay in `apps/companion/app/tokens.css` and
`docs/rules/DESIGN.md`; where a picture and DESIGN.md disagree, ask Craig.

Claude draws each screen as a board in `docs/design/boards/` through the `/design` skill
(`.claude/skills/design/SKILL.md`): a brief, a review panel of four, then Craig's yes. Ported from
draft-platform's pipeline on 7 Nov 2026 (Craig: *"apply the same to the epl draft"*).

Desk first, at 1440. A phone picture is drawn when Craig asks for it; a built screen still must not break at 390
(`/audit-ui`).

## A screen's folder

Named after its route: `league` for `/league`, `squad` for `/squad/[teamId]`.

- `1440.png`: the approved picture at the desk's width.
- `390.png`: the phone's, only once Craig has asked for it.
- `<Screen>.html`: the approved board, so the picture can be redrawn.
- `README.md`:
  - `Route:` the route it shows;
  - the date and Craig's words approving it;
  - the CM shots it borrows from, by number (`docs/ui/reference/cm9900/NN.jpg`);
  - interaction notes, one line per control: what can be tapped and what happens;
  - each placeholder, the data it waits for, and that data's issue.

## Screens

- [`league`](league/README.md): `/league`, the table, desk and phone (8 Nov 2026).
- [`squad`](squad/README.md): `/squad/[teamId]`, a squad's Squad tab, desk and phone (8 Nov 2026).
- [`players`](players/README.md): `/players`, the pool board, desk (8 Nov 2026).
- [`matchday`](matchday/README.md): `/matchday`, Live's Scores, desk (8 Nov 2026).
- [`player`](player/README.md): `/players/[fantraxId]`, a player's Profile, desk (8 Nov 2026).
- [`scoring`](scoring/README.md): `/scoring`, the league's scoring, desk (8 Nov 2026).
- [`squad-fixtures`](squad-fixtures/README.md): `/squad/[teamId]/fixtures`, a squad's Fixtures, desk (8 Nov 2026).
