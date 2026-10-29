---
name: deepen
description: The architecture pass. Looks across the whole codebase, not one diff, for shallow modules, missing seams and a rule kept in two places, then hands Craig up to six candidates in plain words. Craig picks one, it goes to /grill, and the grill ends in the issue. Use only when Craig asks for an architecture pass.
argument-hint: "[an area, such as packages/core/src/league, or nothing for the whole codebase]"
---

# The architecture pass

**Contents:** The words · Explore, split by area · Check before reporting · Up to six, in plain words · Craig picks

`/refactor` is tactical: it tidies what is there. This pass is strategic: it asks whether the code is
cut into the right pieces. Agents find the candidates; Craig decides which are worth it, because that
is a judgement about the product's future, not a fact in the code. Ported from draft-platform's
`/deepen` (29 Oct 2026), itself adapted from Matt Pocock's `improve-codebase-architecture`.

## The words

From John Ousterhout's *A Philosophy of Software Design*. Use these and only these, in the reports
and with Craig:

- **Module:** a unit with one job: a provider's client, the bridge, a cup's draw, a screen with its parts.
- **Interface:** everything a caller must know to use a module correctly: its functions, what they
  take and return, and the rules for calling them (call this before that).
- **Implementation:** what the module does inside, which a caller never needs to know.
- **Deep / shallow:** a deep module hides a lot behind a small interface; a shallow one has an
  interface nearly as big as what it does. Deep is better: callers learn less.
- **Seam:** where one module meets another, through its interface. Tests poke a module at its seam.
- **Adapter:** a thing that plugs in at a seam. Fantrax is the league layer's adapter, replaceable in
  27/28; the live feeds and the recorded payloads the tests replay are two adapters at one seam.
- **Locality:** for whoever changes a module: a change, or a bug, sits in one place.
- **Leverage:** for whoever calls a module: how much it does per thing they must learn.

## 1. Explore, split by area

Given an area, explore that alone. Given nothing, run one `Explore` agent per area in one message,
"very thorough", each over a group of folders of about 5,000 lines
(`find packages/core/src scripts apps/companion/app -name '*.ts*' -not -name '*.test.*' | xargs wc -l`),
and one more over the seams *between* areas: where `packages/core`, `scripts` and the app each work
out the same thing, and where one reaches into another's internals instead of its interface. Each
agent gets the words above, the signs below, and returns candidates with the file and line each
rests on.

The signs:
- **Shallow:** a module whose interface is nearly as big as what it does; a function that only
  passes its arguments on; a caller that must call three things in the right order.
- **Low locality:** one rule (a lock time, a cup's draw, who is in a squad, a stale window) worked out
  in two places, so a change means finding both; the last few fixes in one area touched many files
  (`git log --stat -20 -- <area>`).
- **No seam:** logic testable only through a rendered route or a live provider, so its tests are
  slow or missing; a test double replacing the logic it should protect.
- **Leaking:** a caller that knows a module's internals: a Fantrax payload's raw shape outside
  `fantrax/`, FPL's per-season `id`, a page doing the join the bridge exists for.

## 2. Check before reporting

Read the code each candidate rests on yourself. Drop any that:
- is only similar, not the same rule (CODE_RULES §1's rule of 2/3 holds here too);
- joins the football and league layers, or names a league in code (CLAUDE.md's *Never*);
- turns a league's rule into a constant instead of reading `getLeagueInfo`;
- lifts code into a package shared with the 27/28 platform, whose copy is on purpose;
- deepens for a feature nobody has asked for (`docs/rules/PRODUCT.md`).

## 3. Up to six, in plain words

Rank by what Craig gets for the cost. Each candidate, for someone who doesn't read the code:

```
1. <What is wrong, in one line, no file names.>
   For example: <one concrete case, as a manager or as the next change would meet it>.
   The fix: <the deeper module, its interface in a sentence>.
   You get: <fewer places to change / a test that can now be written / ...>.
   Size: <about N files, M pull requests>. Touches scoring, lineups, the bridge or saved data: <yes/no>.
```

Then the file and line evidence under each, for the builder, not for Craig. A pass that finds
nothing worth it says so; never pad the list.

## 4. Craig picks, then /grill

Stop and wait for Craig's pick. The pick goes to `/grill`, which settles the module's interface in
rounds (the functions, what each takes and returns, where the seam and its test sit) and ends in the
issue. One that touches scoring, a lineup save, the bridge or saved data is its own pull request,
proved by the suite and `shape-diff`/`bridge:check` before and after.

When Craig is away, the list goes into the session's handover for him and nothing is built from it.
The candidates he didn't pick are dropped, not filed: the next pass finds them again if they still
matter.
