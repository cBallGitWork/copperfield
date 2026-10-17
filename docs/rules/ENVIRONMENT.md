# Environment and data commands

Moved out of CLAUDE.md on 16 Oct 2026, word for word. The four gates and the push three stay
there.

## Environment

- **No league is named in code.** `FANTRAX_LEAGUE_ID` names the one league served, with no
  default: Vercel for the app (the real league, `mqsjd23smsgbiqzr`, since 5 Oct),
  `apps/companion/.env.local` for `next dev`, the shell for a script. The server, the writer,
  smoke and team-codes refuse to run without it. CI keeps no copy: it asks production
  (`GET /api/league`). Go-live (7 Oct) adds the team codes and save switches in Vercel and
  redeploys (`/swap-day`).
- The leagues the archive records are data, in `data/leagues/recorded.json`, each named by a
  word (`real`, `dummy`, `rehearsal`). Scripts read it; the app reads two roles from it: `stats`,
  the league whose scoring lists every column at no points, read only for columns the served
  league must not list, and `scoring`, the league whose rules price every point we work out
  ourselves (`app/scoring.ts`). **Never interchangeable with the served one**: that is the
  environment's and swaps on 7 Oct; the roles are data and do not.
- `FANTRAX_DEMO_TEAM_ID` lends a test league's team to a reader with no code, and only when that
  team is in the served league.
- **Two `.env.local` files.** `next dev` roots at `apps/companion`, so the app reads
  `apps/companion/.env.local` (`SESSION_SECRET`, `TEAM_CODES`, `FANTRAX_LEAGUE_ID`,
  `FANTRAX_DEMO_TEAM_ID`) and never the repo root's. Next prints `- Environments: .env.local` when
  it loaded one.
- Scripts load an env file only when their npm script passes one: `team-codes` reads the app's
  (its secret must be the one the app verifies with), `roster-limits` reads the root's, and
  `edition` reads the root's with `--env-file-if-exists` (CI has no file; the key is a
  repository secret).
- Secrets: `write-edition` calls the model through Claude Code on the Max subscription: the CLI's
  login locally, `CLAUDE_CODE_OAUTH_TOKEN` (from `claude setup-token`) in CI; `GAZETTA_VIA=api`
  goes back to `ANTHROPIC_API_KEY`. `OPENAI_API_KEY` is optional, for the drawing; `roster-limits` and `bench-order` need `FANTRAX_COOKIE` (a repository secret for CI's
  `bench-order.yml`). The app saves lineups to Fantrax only where `FANTRAX_COOKIE` (the
  commissioner's session) and `LINEUP_SAVE` are set in Vercel: `on` for every team, or
  comma-separated Fantrax team ids for only those. Everything else reads public endpoints.

## Data and league health

What no test can tell you:

```bash
npm run capture         # every recorded league + the pool into data/snapshots/ (pull first)
npm run capture:status  # per-league staleness; non-zero when overdue
npm run periods         # period↔gameweek alignment against live FPL
npm run bridge          # regenerate the Fantrax→FPL mapping
npm run roster-limits   # position MIN/MAX off the commissioner's setup page; needs
                        # FANTRAX_COOKIE; re-run after the draft
npm run team-codes      # one sign-in code per team, printed once
npm run bench-order     # number each unnumbered bench by total FPts; dry run unless --write;
                        # CI runs it hourly 07–19 UTC and writes 5 minutes before each lock
npm run rotowire-xi     # predicted elevens, RotoWire then Scout; CI runs it hourly Thu to Sat's lock
npm run stats           # the stats league's counts into data/intel/stats/; CI runs it daily
npm run edition         # file the paper's due stories; through Claude Code on the Max subscription
npm run intel-check     # is the intel export fresh and whole
```
