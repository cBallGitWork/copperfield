---
name: grill
description: Interview Craig about a feature before any code exists — map its decisions, ask the open ones in numbered rounds with a recommended answer each, settle the words in the glossary, and end with the issue. Craig starts it.
argument-hint: "[the feature, one sentence]"
disable-model-invocation: true
---

# Grill before building

A one-sentence ask leaves gaps, and an agent fills every gap with a silent guess. This skill
turns those guesses into questions Craig answers before the first line is written.
Adapted from Matt Pocock's `grill-me` / `grill-with-docs` (skills v1.3, Oct 2026).

## 1. Map the decisions

Draw the feature as a tree: the ask at the top, every decision it implies underneath, and
the decisions those imply. A decision belongs here when two reasonable builds would differ on
it: what shows, when, to whom, what happens at the edge (a locked gameweek, a blank, a man
who did not play, a league that has not set the rule).

**The frontier** is every decision whose parent is settled. Ask only the frontier.

## 2. Facts are yours, decisions are Craig's

Never ask Craig a fact. If the answer is in the tree, the payload or the docs, go and read it:
`probe-runner` for a provider field, `Explore` for the code, `docs/rules/` for a standing
rule. A rule already written down (DESIGN, PRODUCT, CODE_RULES, providers.md, memory) is
settled; quote it, do not re-ask it.

## 3. One numbered round at a time

```
Round 2 — 4 open

1. A locked gameweek: does the planner show it read-only, or hide it?
   Recommend: read-only, greyed — never-write-a-locked-week already forbids the save.
2. ...
```

Every question carries your recommendation and one clause of why, so most answers are
"yes, yes, no, 3: hide it". Answers settle a layer and light the next frontier. Expect about
six questions on a small change and twenty on a normal one; past thirty, the feature is two
features. Say so.

**Some questions do not settle by talking**, usually what a screen looks like. Build two or
three throwaway variants that look nothing alike, `/shoot` each at 390, and let Craig pick.
The pick comes back into the grilling as an answer.

## 4. One word for one thing

When Craig uses two words for what might be one thing, or one word for two, stop and ask:
"is a *swap* the same as a *transfer*?" Record the answer in the glossary,
`docs/providers/README.md` §Glossary: the term, one line of meaning, and the words to avoid.
A term already there is settled (`gameweek`, never `round`).

## 5. Done is an empty frontier and a yes

Do not write code while the frontier has a question on it. When it is empty, ask once: "same
page?" On yes, write the issue:

- **Title** says what is wrong (working agreement 7), not what to add.
- **Problem**, then **the fix** in a paragraph.
- **Stories**, numbered: *as a manager who …, I …*. One per settled decision.
- **The seam**: where the tests will poke the feature. Aim for one, in `packages/core` if the
  logic is pure.
- Labels per the working agreement. The repo is public: the issue carries the task, never
  the plan or the roadmap.

A feature bigger than one session's smart zone (~150k tokens) is cut into several issues,
each a thin slice through every layer that works on its own, with the blocking order named.
The issue closes by merge; the decisions then live in the code, the tests and the glossary.
