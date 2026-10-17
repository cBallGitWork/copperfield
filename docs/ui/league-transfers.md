# `/league/transfers` — every move in the league

Every claim, drop and trade in the league on one page, newest first, a tab of Draft (Craig, 7 Oct 2026: *"need
somewhere to put all the transfers in the league … a league wide page for quick reference"*). **It is the team
Transfers tab's ledger with each row's mover named, read off the same feed, so the two can never disagree.**

`../rules/DESIGN.md` is binding for colour and type and this file defers to it.

## On the page

- Draft's frame (`league/Shell`): the league's bar and its strip, Transfers lit.
- The ledger (`components/league/Ledger`, no `teamId`): the date block, **the mover** on his own colour, the type
  in the info ink, who came in, who went out, and a trade's partner. Under a thumb a plate prints the league's short
  name (*DOME*); the desk prints the full one.
- **Every name opens his page** (`/players/[fantraxId]`, the id the feed's own row carries), at the tight row's 36px
  under a thumb (16 Oct 2026: 66 names and not one could be tapped). The team Transfers tab draws the same ledger,
  so its names link too.
- No moves: *Nothing* says so, coded `0 deals`.

## Whose move a row is

A deal has no single owner in the feed: a claim names the team that gained, a bare drop only the one that let go,
and a trade both. `moverOf` (core `gazette/dealSides.ts`) takes the first team that gained, or for a bare drop the
one that let go; a trade is drawn from its first side, with the other on the partner plate, exactly as the team
page draws it from his side. Tested in `dealSides.test.ts`.

## Why Draft and not Mail

It sat under Mail from 7 Oct 2026, when a seventh Draft tab would not fit a phone. On 13 Oct Mail had three rows of
blue buttons before its first letter, and Schedule and Results became one Fixtures tab, which freed the plate.
`/news/transfers` redirects here.
