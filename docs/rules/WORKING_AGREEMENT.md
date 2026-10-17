# Working agreement — issues, branches, PRs

Moved out of CLAUDE.md on 16 Oct 2026, word for word, so CLAUDE.md stays a contents page.

Set up 17 Sep 2026 (Craig: *"no working off main, branches for each sub task"*). **An issue is a
task somebody could pick up; a doc records a decision.** Deferrals and open questions live in
ROADMAP's *Explicitly parked*, DESIGN §8's *Deferred, deliberately* and PLATFORM_NOTES' *Questions*,
never in an issue.

**Issues**

1. An issue is for work not started, or blocked. Work in flight is a branch and a PR.
2. One issue, one branch, one PR. No epics.
3. The issue holds state; the doc holds reasoning. Link, never copy.
4. Issues close by merge: `Closes #N` in the PR body.
5. A deferral is not an issue: write it into ROADMAP or DESIGN §8 instead.
6. Reconcile the list at every `/phase-gate`.
7. Titles say what is WRONG, not what to add: *"the desk does not know what day it is"*.

**Branches and PRs**

8. Never work on `main`. Cut from `origin/main`: three crons push to it (capture, editions and
   the elevens, all through `scripts/ci/push.sh`). Prefixes: `feat/` `fix/` `refactor/`
   `docs/` `chore/`.
9. Squash-merge, always (see CLAUDE.md's *Pitfalls*).
10. Stage named paths; another session may be committing in the same tree.
11. Push before the pile grows. Unpushed work is the repo's most-repeated failure. Open the PR as a draft and
    mark it ready for review when it is done: CI's Verify runs only on ready PRs.
12. The four gates before any commit; the push three before a push that changes what the app serves (see CLAUDE.md's *Commands*).
13. Every PR carries a two-pass refactor before it opens. **Pass one counts** the duplication:
    extract at three, and at two write down the count you declined at. **Pass two reads what pass
    one left**: orphaned imports, dead bindings, dated comments. A pass that finds nothing says so.
    Refactor and behaviour changes are separate commits.

**Labels** live only in GitHub. Type, exactly one: `feat` `fix` `refactor` `docs` `chore`. Area,
at most one: `paper` `desk` `league` `football` `ci` `intel`. State, only when true: `blocked`
(name the blocker and who can clear it) and `swap-day`. No `parked` or `deferred` label, and no
label for the commit-only prefixes `perf`, `test` and `probe`. One milestone: `7 Oct — go live`. `alert` is the
bot's: `scripts/ci/alert.sh` opens one issue per failing job and closes it when the job next goes green.

**`@claude` on a PR** asks `.github/workflows/claude.yml` for a review. It answers only an owner,
member or collaborator, and it reviews, never merges.
