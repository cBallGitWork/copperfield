#!/usr/bin/env bash
# The failed edition's reason for its alert, from the run's log: `edition-reason.sh <log>`. Prints nothing when none.
# A refused login gets the fix; anything else the first line naming why a story failed, cut to fit an issue title's eye.
set -euo pipefail
log=${1:?edition-reason.sh <log>}
[ -f "$log" ] || exit 0
if grep -qE 'API Error: 401|Invalid bearer token|Failed to authenticate' "$log"; then
  echo "401: the paper's CLAUDE_CODE_OAUTH_TOKEN was refused. Re-run claude setup-token and replace the repository secret."
  exit 0
fi
grep -m1 -oE '(failed: |Error: ).*' "$log" | cut -c1-200 || true
