#!/bin/bash
# The Mac's half of the week: the sister repo's exports into a PR that merges once CI passes.
#   sync-intel.sh weekly    Tuesday, the round settled: every sister file, cups, careers and league projections
#   sync-intel.sh weekly catch-up   Tuesday 14:00 and Wednesday 08:00: the same, only while the weekly's alert is open
#   sync-intel.sh pressers  Thursday 16:00 and 17:15, Friday 12:30, 14:00, 15:45 and 17:45: the press conferences, squads, depth and xMins
#   sync-intel.sh zones     every half hour: shots and touches of matches the Mac's SofaScore pages hold; silent when none is new
# Every run ends in an alert.yml dispatch, intel-<mode> ok or fail, which the watchdog reads. DRY_RUN=1 stops before the push.
# launchd starts with a bare PATH; node comes from the newest nvm install. Then the token, before anything can fail.
NODE_BIN=$(ls -d "$HOME"/.nvm/versions/node/*/bin 2>/dev/null | sort -V | tail -1)
export PATH="${NODE_BIN:+$NODE_BIN:}/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin"
GH_TOKEN=${GH_TOKEN:-$(gh auth token --user cBallGitWork 2>/dev/null)}; export GH_TOKEN
# A fetch begun as the Mac slept hung for an hour on 20 Oct and held the lock past the weekly's wait; ssh now gives up.
export GIT_SSH_COMMAND=${GIT_SSH_COMMAND:-ssh -o ConnectTimeout=20 -o ServerAliveInterval=15 -o ServerAliveCountMax=4}
set -Eeuo pipefail

MODE=${1:-}
CATCH_UP=$([ "${2:-}" = catch-up ] && echo 1 || echo 0)
MAIN=${EPL_DRAFT:-$HOME/epl-draft-1}
WT=${INTEL_WORKTREE:-$HOME/epl-draft-intel}
SISTER=${SISTER_REPO:-$HOME/ai-carling-premiership}
export FFS_SCRAPE_DIR=${FFS_SCRAPE_DIR:-$SISTER/data/raw/fantasy_football_scout/daily}
REPO=cBallGitWork/copperfield
LOG=${INTEL_LOG:-$HOME/Library/Logs/epl-draft-intel.log}
LOCK=$HOME/epl-draft-intel.lock
OUT=$(mktemp -d)
FINISHED=0
LAST_ERROR=""

log() { printf '%s %s %s\n' "$(date '+%Y-%m-%d %H:%M')" "$MODE" "$*" | tee -a "$LOG"; }
notify() { /usr/bin/osascript -e "display notification \"$1\" with title \"epl-draft intel\"" >/dev/null 2>&1 || true; }

# alert <source> fail|ok "<message>": alert.yml opens or closes the issue "alert: <source>". Three tries.
alert() {
  local try
  [ "${DRY_RUN:-0}" = 1 ] && { log "dry run: would alert $1 $2: $3"; return 0; }
  for try in 1 2 3; do
    gh workflow run alert.yml -R "$REPO" --ref main -f source="$1" -f state="$2" -f message="$3" >/dev/null 2>&1 && return 0
    [ "$try" = 3 ] || sleep 20
  done
  log "could not dispatch alert $1 $2"
  notify "alert $1 $2 never reached GitHub"
  return 1
}
# A soft alert has its own source, so this run's ok cannot close it; ok is sent only when its issue is open.
OPEN_ALERTS=${OPEN_ALERTS-$(gh issue list -R "$REPO" --label alert --state open --json title --jq '.[].title' 2>/dev/null || true)}
soft() {
  if [ "$2" = ok ] && ! grep -qx "alert: $1" <<<"$OPEN_ALERTS"; then return 0; fi
  [ "$2" = fail ] && log "ALERT $1: $3"
  alert "$@" || true
}

fail() { log "FAILED: $1"; notify "$MODE failed: $1"; alert "intel-$MODE" fail "$1" || true; FINISHED=1; exit 1; }
finish() { log "$1"; alert "intel-$MODE" ok "$1" || true; FINISHED=1; exit 0; }
quiet() { log "$1"; FINISHED=1; exit 0; }
on_exit() {
  local status=$?
  if [ "$FINISHED" = 0 ]; then
    log "FAILED: died with status $status at ${LAST_ERROR:-an unknown line}"
    notify "$MODE died: ${LAST_ERROR:-status $status}"
    alert "intel-$MODE" fail "sync-intel.sh died with status $status at ${LAST_ERROR:-an unknown line}" || true
  fi
  [ "$(cat "$LOCK/pid" 2>/dev/null)" = "$$" ] && rm -rf "$LOCK"
  rm -rf "$OUT"
}
# retry <label> <command...>: five tries, 15 s doubling (a Mac just woken has no network for a minute or two), each
# failure logged with the command's last stderr line; stdout passes through, so a caller may capture it.
retry() {
  local label=$1 try wait=${RETRY_WAIT:-15} err
  shift
  err=$(mktemp)
  for try in 1 2 3 4 5; do
    if "$@" 2>"$err"; then rm -f "$err"; return 0; fi
    log "$label failed, try $try of 5: $(tail -1 "$err")" >&2
    [ "$try" = 5 ] || { sleep "$wait"; wait=$((wait * 2)); }
  done
  rm -f "$err"
  return 1
}
# The branch's PR, opened once: a create whose answer was lost (a reset connection, 18 Oct) may have opened it already.
open_pr() {
  gh pr view -R "$REPO" "$BRANCH" --json url --jq .url 2>/dev/null && return 0
  gh pr create -R "$REPO" --base main --head "$BRANCH" --label chore --label intel --title "$TITLE" \
    --body "Written by \`scripts/sync-intel.sh $MODE\` on Craig's Mac. Changed: $CHANGED. It merges itself once CI's verify passes."
}
# Tests source the helpers above and stop here.
[ "${SYNC_INTEL_LIB:-0}" = 1 ] && return 0

trap 'LAST_ERROR="line $LINENO: $BASH_COMMAND"' ERR
trap on_exit EXIT

case "$MODE" in
  weekly) KINDS="squads set-pieces strength depth matches lines shots touches projections" ;;
  pressers) KINDS="squads depth projections" ;;
  zones) KINDS="shots touches" ;;
  *) MODE=sync; FINISHED=1; log "usage: sync-intel.sh weekly|pressers|zones"; exit 2 ;;
esac
[ -n "$GH_TOKEN" ] || fail "no cBallGitWork token from gh"

# The weekly's later slots run only while its morning's alert, a failure or a stale sweep, is still open.
if [ "$CATCH_UP" = 1 ] && ! grep -qxE "alert: intel-$MODE(-stale)?" <<<"$OPEN_ALERTS"; then
  quiet "catch-up: no intel-$MODE alert open"
fi

# One run at a time, an hour's wait at most; a lock whose holder has died is taken over.
for _ in $(seq 1 120); do
  if mkdir "$LOCK" 2>/dev/null; then echo $$ >"$LOCK/pid"; echo "$MODE" >"$LOCK/mode"; break; fi
  holder=$(cat "$LOCK/pid" 2>/dev/null || true)
  if [ -z "$holder" ] || ! kill -0 "$holder" 2>/dev/null; then
    log "taking over a stale lock from pid ${holder:-unknown}"
    rm -rf "$LOCK"
    continue
  fi
  [ "$MODE" = zones ] && quiet "pid $holder holds the lock; the next half hour tries again"
  sleep 30
done
[ "$(cat "$LOCK/pid" 2>/dev/null)" = "$$" ] \
  || fail "a $(cat "$LOCK/mode" 2>/dev/null) run (pid $(cat "$LOCK/pid" 2>/dev/null)) held $LOCK for an hour"

# A fresh worktree on origin/main; the main folder is never touched.
retry "git fetch" git -C "$MAIN" fetch -q origin || fail "could not fetch origin in 5 tries; is the network up?"
[ -d "$WT" ] || git -C "$MAIN" worktree add -q --detach "$WT" origin/main || fail "worktree"
cd "$WT"
git checkout -q --detach origin/main && git reset -q --hard origin/main && git clean -fdq data/intel || fail "reset"
HASH=$(shasum package-lock.json | cut -c1-12)
if [ ! -f node_modules/.lock-hash ] || [ "$(cat node_modules/.lock-hash)" != "$HASH" ]; then
  npm ci --no-audit --no-fund >/dev/null 2>&1 || fail "npm ci"
  echo "$HASH" > node_modules/.lock-hash
fi

if [ "$MODE" = zones ]; then
  # The committed shots and touches plus the finished matches the Mac's SofaScore pages hold and they lack.
  SHOTS=$(ls data/intel/shots/*.json | sort | tail -1)
  SEASON=$(basename "$SHOTS" .json)
  (cd "$SISTER" && ./.venv/bin/python scripts/export/epl_draft_intel.py --season "$SEASON" \
    --zones-live "$WT/$SHOTS" "$WT/data/intel/touches/$SEASON.json" --out "$OUT" >"$OUT/export.log" 2>&1) \
    || fail "the sister's zones export: $(tail -1 "$OUT/export.log" 2>/dev/null)"
  verdict=$(tail -1 "$OUT/export.log")
  [ -f "$OUT/shots/$SEASON.json" ] || quiet "${verdict:-the zones export said nothing}"
  log "sister: $verdict"
else
  # The GitHub sweep's data from R2, judged for age, then exported; it writes every kind and this mode takes its own.
  status=0
  (cd "$SISTER" && ./.venv/bin/python "$WT/scripts/sister-export.py" "$SISTER" "$OUT" "$MODE" >"$OUT/fresh.log" 2>&1) || status=$?
  verdict=$(tail -1 "$OUT/fresh.log" 2>/dev/null || true)
  log "sister: ${verdict:-no output}"
  case "$status" in
    0) soft "intel-$MODE-stale" ok "fresh" ;;
    3) soft "intel-$MODE-stale" fail "${verdict#stale: }; exported what the Mac holds" ;;
    *) fail "the sister export: ${verdict:-exit $status}" ;;
  esac
  grep '^  !' "$OUT/export.log" >>"$LOG" 2>/dev/null || true
fi
for kind in $KINDS; do
  found=0
  for file in "$OUT/$kind"/*.json; do
    [ -f "$file" ] && { cp "$file" "data/intel/$kind/$(basename "$file")"; found=1; }
  done
  [ "$found" = 1 ] || { tail -20 "$OUT/export.log" >>"$LOG" 2>/dev/null; fail "the export wrote no $kind; its tail is in the log"; }
done

# Weekly and pressers: each player's FPL history by code, the page's season when FPL will not answer Vercel.
if [ "$MODE" = zones ]; then :
elif SISTER_REPO="$SISTER" npm run -s intel-history >>"$LOG" 2>&1; then soft intel-history ok "player histories read"
else soft intel-history fail "intel-history refused; histories left as they were"; fi

if [ "$MODE" = weekly ]; then
  if SISTER_REPO="$SISTER" npm run -s intel-cups >>"$LOG" 2>&1; then soft intel-cups ok "cups read"
  else soft intel-cups fail "intel-cups refused; cups left as they were"; fi
  if SISTER_REPO="$SISTER" npm run -s intel-careers >>"$LOG" 2>&1; then soft intel-careers ok "careers read"
  else soft intel-careers fail "intel-careers refused; careers left as they were"; fi
  # Our league's points off the fresh projections, and a dated copy: a trade is judged by a man's worth that week.
  if npm run -s draft-pack >>"$LOG" 2>&1; then
    for file in data/intel/league-projections/*.json; do
      mkdir -p data/intel/league-projections/weekly
      cp "$file" "data/intel/league-projections/weekly/$(basename "$file" .json)-$(date +%F).json"
    done
    soft intel-league-projections ok "league projections priced"
  else
    soft intel-league-projections fail "draft-pack refused; league projections left as they were"
  fi
elif [ "$MODE" = pressers ]; then
  # Scout's day archives around the next deadline, then yesterday's and today's conferences (a day re-run replaces itself).
  if (cd "$SISTER" && ./.venv/bin/python scripts/ingest/ingest_ffscout_daily.py >"$OUT/ffscout.log" 2>&1); then
    soft intel-scout-scrape ok "the Scout scrape ran"
  else
    soft intel-scout-scrape fail "the Scout scrape refused: $(tail -1 "$OUT/ffscout.log" 2>/dev/null)"
  fi
  npx tsx scripts/ingest-pressers.ts "$(date -v-1d +%Y-%m-%d)" >/dev/null 2>&1 || log "no conferences ingested for yesterday"
  if npx tsx scripts/ingest-pressers.ts "$(date +%Y-%m-%d)" >"$OUT/pressers.log" 2>&1; then
    soft intel-pressers-ingest ok "today's conferences ingested"
  else
    soft intel-pressers-ingest fail "no conferences ingested for $(date +%Y-%m-%d): $(grep -m1 -o 'Error: .*' "$OUT/pressers.log")"
  fi
fi

# Between Tuesdays a file whose only change is its manifest is not a change; Tuesday's stamp is what intel-check ages.
if [ "$MODE" = pressers ]; then
  for file in $(git status --porcelain data/intel | awk '$1 == "M" {print $2}'); do
    if [ "$(git show "HEAD:$file" | /usr/bin/jq -S -c 'del(.manifest)' | shasum)" = "$(/usr/bin/jq -S -c 'del(.manifest)' "$file" | shasum)" ]; then
      git checkout -q -- "$file"
    fi
  done
fi

# What this run's xMins export moved against the one it replaces, for the scout's letter: Tuesday's and the pressers'.
[ "$MODE" = zones ] || npm run -s xmins-moves >>"$LOG" 2>&1 || log "xmins-moves refused; no scout's letter this run"

CHANGED=$(git status --porcelain data/intel | awk '{print $2}' | tr '\n' ' ')
[ -n "$CHANGED" ] || finish "nothing changed"
log "changed: $CHANGED"
npm run -s intel-check >>"$LOG" 2>&1 || true
[ "${DRY_RUN:-0}" = 1 ] && finish "dry run: stopping before the push"

# CI's verify runs the four gates; a red one leaves the PR open and alerts.
BRANCH="chore/intel-$MODE-$(date +%F-%H%M)"
TITLE="chore: the sister repo's $MODE intel, $(date +%F)"
git switch -q -c "$BRANCH"
git add data/intel
git commit -q -m "$TITLE" -m "Written by scripts/sync-intel.sh $MODE on Craig's Mac: $CHANGED" || fail "commit"
SHA=$(git rev-parse HEAD)
# The token reaches git through askpass, never the command line ps shows; no helper may store it.
ASKPASS="$OUT/askpass"
# shellcheck disable=SC2016  # $GH_TOKEN is for askpass to expand, not this shell
printf '#!/bin/sh\necho "$GH_TOKEN"\n' >"$ASKPASS" && chmod 700 "$ASKPASS"
retry "git push" env GIT_ASKPASS="$ASKPASS" GIT_TERMINAL_PROMPT=0 git -c credential.helper= -c http.lowSpeedLimit=1000 \
  -c http.lowSpeedTime=60 push -q "https://x-access-token@github.com/$REPO.git" "$BRANCH" || fail "push"
PR=$(retry "gh pr create" open_pr) || fail "pr"

state=""
for _ in $(seq 1 90); do
  state=$(gh run list -R "$REPO" --workflow verify.yml --commit "$SHA" --limit 1 --json status,conclusion --jq '.[0] | "\(.status) \(.conclusion)"' 2>/dev/null || true)
  case "$state" in completed*) break ;; esac
  sleep 20
done
[ "$state" = "completed success" ] || fail "verify said '${state:-nothing}' after 30 minutes; $PR left open"
git checkout -q --detach origin/main
gh pr merge -R "$REPO" "$PR" --squash --delete-branch >/dev/null || fail "merge of $PR"
git branch -D "$BRANCH" >/dev/null 2>&1 || true
notify "$MODE intel merged"
finish "merged $PR"
