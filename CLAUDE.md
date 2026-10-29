# Tim Hortons Pro League — companion + platform monorepo

A companion app for a 10-team Fantrax Premier League draft league, live since **Wed 7 Oct 2026**
(GW6 on). Fantrax is the source of truth this season; this repo republishes the league with what
Fantrax lacks. The 27/28 platform has its own repo.

## Read first

- **`docs/rules/CODE_RULES.md` is binding for all code**: rule of 2/3, no bloat, no hardcoding,
  small files, purity at the core. An exception is recorded in `docs/record/PLATFORM_NOTES.md` in
  the same commit.
- **`docs/rules/DESIGN.md` is binding for anything visible**: a printed paper at `/`, a
  Championship Manager 99/00 desk on League, Prem, Live, News and FPL, and a palette in which every
  colour is a slot with one meaning. It also lists what is deferred on purpose.
- `docs/rules/PRODUCT.md`: who this is for. Read it before a product decision.
- `docs/plans/GAZETTA.md` is the paper's live plan; `docs/plans/ROADMAP.md` is the app's, now
  mostly a record. Mark an item in the commit that lands it.
- `docs/record/PLATFORM_NOTES.md` is what is true now: probes, decisions, rule exceptions. It is
  meant to be read, and `docs-drift-auditor` checks it. `docs/record/SEASON_LOG.md` is dated
  accounts of a day's work, meant to be searched; true as a record, never a claim about the tree.
- `.claude/rules/providers.md` holds the verified FPL, Fantrax and identity facts, including the
  login constraint. It loads in `packages/core/src`, `scripts` and the app's data modules. Read it
  before designing on a provider field.
- `docs/providers/README.md` is the ingestion map: every source, who calls it, when it runs,
  where it lands and what notices it stale. Read it before touching a client, a cron or a cache.
- `docs/rules/ENVIRONMENT.md`: env vars, the two `.env.local` files, secrets, and the data and
  league health commands. Read it before running a script or touching Vercel.
- `docs/rules/WORKING_AGREEMENT.md`: issues, branches, PRs and labels. Read it before opening one.
- Long docs open with a contents list; PLATFORM_NOTES is too long for one, so list its sections
  with `grep -n '^## '` and read the one you need.
- When asked for a plan, start from this season's needs, then the long-term platform.

## Stack

Node 24 locally, 22 in CI; deployed on Vercel.

Next 16: route `params` may be a `Promise` (await it); `'use cache'` needs `cacheComponents`.
Read `node_modules/next/dist/docs/` before writing framework code.

## Commands

All four green before every commit:

```bash
npm test          # vitest across packages/*, scripts/ and the app
npm run typecheck # core, scripts and the app, all with --noUnusedLocals
npm run lint      # ESLint; next build stopped running it at Next 16
npm run build     # Next production build
```

Before a push that changes what the app serves (`apps/companion`, `packages/core`), three more, against a running app.
A push of scripts, data or docs alone leaves smoke and the bridge to CI's `verify`, which runs both; `shape-diff`
runs before any push that touches a Fantrax reader (Craig, 8 Oct 2026: "coding is so slow"):

```bash
FANTRAX_LEAGUE_ID=<id> npm run start &                                   # refuses without a league
SMOKE_BASE=http://localhost:3000 FANTRAX_LEAGUE_ID=<id> npm run smoke    # every route
npm run shape-diff     # the real league still answers in the shape raw.ts expects
npm run bridge:check   # every rostered player resolves to a footballer
```

Data and league health (`capture`, `bridge`, `bench-order`, `edition` and the rest):
`docs/rules/ENVIRONMENT.md`.

## Environment

**No league is named in code.** `FANTRAX_LEAGUE_ID` names the one league served, with no default;
the app reads `apps/companion/.env.local`, never the root's. The rest, including secrets and which
script reads which env file: `docs/rules/ENVIRONMENT.md`.

## Architecture: two layers, never conflated

```
football layer (FPL, public)      →  the real Premier League
league layer  (Fantrax, cookie)   →  our fantasy competition
        ↘ join on player identity ↙
```

The football layer is permanent; the league layer is an adapter, replaceable in 27/28 without
touching football or the UI. **FPL's rules are fixed, so they can be constants. Custom rules are
Fantrax's product**: roster limits, positions, scoring, the period calendar, the lineup deadline,
team count, the schedule and the draft type are all data read from `getLeagueInfo`, never assumed
and never inferred from football. An FPL concept crossing into the league arrives in football
clothes: `element_type` did, and `deadline_time` would.

The layers meet at player identity (the bridge) and the calendar, which the league is told as
plain data (`league/calendar.ts` declares its own `GameweekKickoff`). Neither imports the other; a
script does the wiring.

## Conventions

The binding set is `docs/rules/CODE_RULES.md`. The ones that bite most here:

- Provider I/O lives in adapters (`packages/core/src/*/[provider]/client.ts`); mapping (`map.ts`)
  is pure: no clocks, no network. Inject `fetchedAt` and `now`.
- Treat provider data as untrusted and render gracefully on missing fields. Absence is `—`, never
  `0`.
- Pure domain logic lives in `packages/core`, with tests alongside; components present.
- Comments are one line, three at most: what a thing does or what would break. The why goes in the
  commit message, or in PLATFORM_NOTES if it is a standing decision.
- Phone-first: one column, thumb-reachable (`min-h-11`), readable at arm's length.
- A bug starts with the failing test.
- Before starting, say how the result will be checked: a test, a script, a shot. No check, rethink the task.

## Never

- Name a Fantrax league in code, or hardcode a league rule instead of reading `getLeagueInfo`.
- Import the league layer from football, or the reverse.
- Persist FPL's per-season `id`; persist the season-stable `code`.
- Name-match players at runtime. The bridge (`data/mappings/fantrax.json`) is generated, audited
  and committed.
- Score a player by his own position. Fantrax scores the roster SLOT his manager chose.
- Hold a member's password or plan a login on one (see providers.md).
- Print FPL's count beside a Fantrax figure, or anything of ours under a column headed `FPts`.
- `git add -A`, `git merge`, force-push, or commit on `main`. The hooks deny all four.

## Pitfalls we have hit

- A piped instrument reports the pipe's exit code (`| tail` is tail's). Grep the verdict line.
- `next start` renames itself `next-server`, so `pkill -f "next start"` leaves it running and the
  next smoke tests the old build. Stop yours by port, `kill $(lsof -ti tcp:<port> -sTCP:LISTEN)`;
  never `pkill -f next-server`, which kills every session's and worktree's server. Check the
  listener started after the build, and leave none running: `guard_bash.sh` asks before a
  build or server while a `next build` or `next-server` runs with its cwd in this tree.
- Next 16 locks per directory: never start a second dev server. Turbopack in a long-lived
  `next dev` never sees a new file; restart it.
- `.next/types` from another branch's build makes typecheck name routes that are not there. Delete
  `apps/companion/.next/types`.
- A rebase merge deploys only its tip, because `ignoreCommand` reads `HEAD^..HEAD`. Squash-merge.
- An unset Actions variable is `""`, not undefined. Use `||`; `requireLeague` refuses the blank.
- Hooks match the command string, so a script that merely quotes `git add -A` trips the guard.
- A shot taken while another session drives the same Chrome lies. Use a private `CDP_PORT`.

## The crew — `.claude/`

- **Hooks** deny `git add -A`, `git add .`, `git merge`, `git push --force*` and any commit or push
  on `main`. They ask before `npm run capture` (pull first), a second build or server, cutting a
  branch from another branch, and staging a file past 300 lines. A denial is the hook: do what it
  names instead.
- **`tools/ui/`** holds `.mjs` browser instruments over `cdp.mjs`. They talk to an
  already-running headless Chrome on `CDP_PORT` (default 9261) and never launch one; auth is
  `--team-cookie <file>` or `TEAM_COOKIE`.
- **Skills**: `/verify` `/shoot` `/audit-ui` `/probe` `/refactor` `/deepen` (the architecture pass, on Craig's ask), and seven Craig starts: the runbooks
  `/phase-gate` `/handover` `/swap-day` `/rehearsal-saturday`, and `/grill` (interview before
  building, ends in the issue), `/wait-what` (say it again plainly), `/retro` (suggest fixes to
  the surroundings before clearing the chat).
- `.mcp.json` adds Playwright for exploration; deterministic audits stay in `tools/ui/`.

## Working agreement

Never work on `main`: one issue, one branch cut from `origin/main`, one PR, squash-merged, with the
two-pass refactor in its body. The 13 rules, labels and `@claude`: `docs/rules/WORKING_AGREEMENT.md`.
