---
name: retro
description: Read back through this session for where the work struggled, and suggest changes to the surroundings — CLAUDE.md, a hook, a lint rule, a test, a skill, a memory — so the next session does not struggle the same way. Suggests only; Craig picks. Run before clearing the chat.
disable-model-invocation: true
---

# Retro: make it impossible next time

An agent does not complain. It hits a problem, pushes through, and the struggle stays buried
in the transcript. This reads the transcript for it. Adapted from Matt Pocock's `retro`
(skills v1.3, Oct 2026).

## 1. Find the struggle

Read the session back and list each place where:

- a search took more than two tries to find a file or a fact;
- a gate, a hook or a build failed, and why;
- Craig corrected the work (wording, scope, a screen, a rule);
- the same command, query or fix ran three or more times;
- a doc, memory or CLAUDE.md line was wrong, stale or missing;
- something done here breaks a rule in CODE_RULES, DESIGN or the working agreement.

Quote the moment in one line each. A session with nothing on the list says so.

## 2. Pick the cheapest fix that would have stopped it

In this order, because a check holds and a sentence is a hope (memory: check, don't ask the
model):

1. **A check**: a test, a lint rule, a `scripts/` health check, or a hook in `.claude/hooks/`.
   Anything a machine can spot gets one.
2. **A pointer**: one line in CLAUDE.md or a `.claude/rules/` file saying where a thing lives.
3. **A skill change**: a step a runbook was missing.
4. **A memory**: a preference or correction of Craig's that no check can express.

The written rules keep only the calls that need judgement; delete a line that a new check
makes redundant.

## 3. Suggest, never apply

```
Retro — 3 suggestions

1. [check] Spent 4 tries finding where bench order is written. → add `bench-order` to
   docs/providers/README.md's ingestion map.
2. ...
```

Number them, name the kind, the evidence and the exact change. Stop there. Craig picks which
to keep; apply only those, on their own branch. Never fix your own findings unasked: an agent
chasing its own findings chases false positives.
