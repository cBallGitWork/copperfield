---
name: design
description: Draw one desk screen and get it approved, with the same quality control code has. A brief from docs/ui, the CM references, a 1440 board, a render check with the design lint, a review panel of four agents, then Craig's yes and a docs PR saving the picture. Use before any desk screen's layout or look changes, or when Craig asks for a screen to be designed or reskinned.
argument-hint: "[the screen, by its route]"
---

# Design one screen

**Contents:** 1. Brief · 2. References · 3. Draw at 1440 · 4. Render check · 5. The review panel ·
6. Show Craig · 7. Save the approved picture

Ported from draft-platform's `/design` (Craig, 7 Nov 2026: *"apply the same to the epl draft"*), where it is the
UI's answer to the hooks and reviews code already has. It ends in an approved picture in
`docs/design/approved/<screen>/`, which then binds the screen's layout (`.claude/rules/register-palette.md`).

The desk only. The paper (`/`, `/paper/*`) is a newspaper and keeps its own register (DESIGN §4); a board for it
is drawn only when Craig asks. Desk first at 1440; a 390 board only when Craig asks for the phone, and a built
screen still must not break there (`/audit-ui`).

Read `docs/rules/DESIGN.md` first, §2, §3, §7 and §10 at least: §10 is the Never list, and §2's tables hold
Craig's corrections. CM claims cite a numbered shot in `docs/ui/reference/`, never memory.

## 1. Brief

Write the screen's brief before drawing, from `docs/ui/<page>.md` and `docs/rules/PRODUCT.md` only:

- the route, and how a manager reaches it (`shell/sections.ts`, the rail and the strips);
- the jobs a manager does here, each with the line in `docs/ui/` it comes from;
- the data it shows, each fact with its provider (`docs/providers/README.md`), and which are placeholders (not
  held yet, and the issue that brings them).

What the docs don't settle is a question for Craig, asked in chat. Never draw a guessed rule.

## 2. References

`docs/ui/reference/` (`cm9900/` binds; `cm3/`, `cm0102/` the same engine), and what Fantrax and FPL do on the
same screen. Note the one or two shots the board borrows from, by number; they go in the README later. CM is the
look and the organisation here, which is the difference from draft-platform, where FM leads.

## 3. Draw at 1440

One board is one self-contained HTML file, `docs/design/boards/<Screen>.html`: its own `<style>`, the desk's
tokens copied as custom properties from `apps/companion/app/tokens.css` (never a new hex for a slot that has a
token; a new slot is a Craig's call), the committed faces by relative path from `apps/companion/app/fonts/`, and
the real ground from `apps/companion/public/ground/`. No script: a board is a picture.

- Copy an existing board as the pattern.
- Real team names (`data/leagues/short-names.json`), made-up figures that look real, every placeholder in its real
  place and size.
- Every colour on its slot (§3): yellow is yours, cyan a derived reading, a name is white.

## 4. Render check

Headless Chrome on 9261 (`/shoot`, step 2), then:

```bash
node tools/ui/boardshot.mjs docs/design/boards/<Screen>.html /tmp/<Screen>-1440.png
node tools/ui/designlint.mjs docs/design/boards/<Screen>.html
```

`boardshot` prints the faces that loaded, the height and fails on sideways scroll; a face missing from its list
is a broken path. `designlint` fails what §10 marks †.

Read every PNG with the Read tool. A picture you did not open is not evidence. Fix what the lint or the picture
shows, and render again. Stop after three rounds in a row that change nothing the lint or the picture shows: say
what is still wrong, what each round tried, and hand it to Craig.

## 5. The review panel

Four reviewers, run in parallel in one message, each a read-only agent:

| Agent | Lens |
|---|---|
| `design-cm-player` | is it Championship Manager 99/00: plates, rail, strips, density, where things sit |
| `design-draft-manager` | a manager in this league: his weekly jobs fast, nothing he doesn't need, nothing missing |
| `design-ux` | layout, scan speed, contrast, DESIGN §3's slots and §10's Never list, line by line |
| `design-pm` | matches `docs/ui/` and the brief, nothing invented, build cost, which screens it reaches |

Give each the PNG paths, the brief and the lint's output. Each returns numbered findings and Craig's calls. Fix
the clear-cut findings (a broken rule, an invented control, a fact the brief holds that is missing), render and
lint again. Where two reviewers disagree, or a finding is taste, it goes to Craig.

## 6. Show Craig

Send Craig the picture itself (SendUserFile, not only a path) with a short list:

- what the panel changed, one line each;
- where they disagreed, and every Craig's call, each a question with the options and a recommendation.

Pictures are approved only in a session Craig is watching. Each round of his comments goes back through steps 4
and 5.

## 7. Save the approved picture

On his yes, a `docs/` branch and PR (`docs/rules/WORKING_AGREEMENT.md`) adds `docs/design/approved/<screen>/`
(the route's name: `league` for `/league`, `squad` for `/squad/[teamId]`):

- `1440.png`, the shot of the approved board;
- the board's HTML beside it, so the picture can be redrawn from its source;
- `README.md` as `docs/design/approved/README.md` sets out;
- the screen's line in `docs/design/approved/README.md`'s Screens list.

The PR quotes Craig's yes and the panel's findings. When the board needed a value `tokens.css` doesn't hold, the
token lands in the build PR, with DESIGN §3's row for it, never in the docs PR.
