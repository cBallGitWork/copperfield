#!/usr/bin/env bash
# Vercel's ignoreCommand (apps/companion/vercel.json): exit 0 skips the build, 1 builds. Production only; a merge
# commit always builds; otherwise only a change outside what the app never reads. Vercel caps the command at 256.
if [ "$VERCEL_ENV" != production ]; then exit 0; fi
if git rev-parse -q --verify HEAD^2 >/dev/null; then exit 1; fi
git diff --quiet HEAD^ HEAD -- ':(top)' \
  ':(exclude,top)data/snapshots' \
  ':(exclude,top)data/probes' \
  ':(exclude,top)docs' \
  ':(exclude,top).claude' \
  ':(exclude,top,glob)**/*.md'
