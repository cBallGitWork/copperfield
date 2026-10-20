# `/squad` — every squad

Your squad, then everyone else's.

## On the page

- A `←` at the title bar's left on a phone, back to More, which is where its Squads row is (16 Oct 2026). Not at
  `/squad/me`, which draws this index for a reader with no team: that is the Team tab's own page.
- One list. Your own squad first, its row on the raised surface with the accent edge; no "You" chip (Craig,
  5 Sep 2026): the edge and the top place carry it. No "Around the league" heading since 20 Oct 2026.
- Every row: name, **who he plays this week** (`v Glengarry`, a lowercase `v` as every other screen), a squad size
  (`13/14`) only when short of or over the league's limit (`maxTotalPlayers` from the `getLeagueInfo` the page
  already holds; none named, none printed), and an `n unmapped` badge when we cannot fully identify a squad.
  Never silently short.

  The opponent costs no read: the schedule is already in the payload this page
  fetched, and it is what turns a directory of ten names into the week's
  fixtures. No schedule for the period, or a Fantrax that would not describe the
  league, renders as no line rather than as a guess.

  **In the week's pairing order** (`inPairingOrder`, 16 Oct 2026): the schedule's ties in its own order, each
  tie's two sides together, so the list reads as the week's fixtures. It was the roster payload's order, which
  is no order a member knows and split every tie. A team with no tie that week follows the rest.
- If the reader has not signed in, `SignIn` sits at the head, above the list. Sign-in
  is a per-team code, not a password. A good code lands on your own team (`/squad/me`), not back on this list.
  The box is labelled "Code from the commissioner", which is the only clue to where one comes from: the two
  sentences that said so went in #489 and are not coming back. A wrong code says so and keeps the box as typed,
  with the cursor in it, so a one-letter slip is one letter to fix.

- "Not you? Sign out" under the list, a `min-h-11` button on a panel, for a real code only (20 Oct 2026: it sat
  between your team and the rest, for an action used once a season).

Every row links to `/squad/[teamId]`.

## States

- **Unavailable** — Fantrax silent.
- **Undrafted** — "Nobody has a squad yet", with the league's draft date read
  from config. **This is our real league's state until 10 Oct**, so it is a
  designed screen and not a fallback.

## Known gaps

**No form and no record.** Both would need `getStandings`, which this page does
not read — a data-flow change rather than part of a visual pass.
