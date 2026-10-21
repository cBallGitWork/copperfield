# `/league/transfers` — every move in the league

Every claim, drop and trade in the league on one page, newest first, a tab of Draft (Craig, 7 Oct 2026: *"need
somewhere to put all the transfers in the league … a league wide page for quick reference"*). **It is the team
Transfers tab's ledger with each row's mover named, read off the same feed, so the two can never disagree.**

`../rules/DESIGN.md` is binding for colour and type and this file defers to it.

## On the page

- Draft's frame (`league/Shell`): the league's bar and its strip, Transfers lit.
- **The waiver line**, under the strip all week: *Waivers run Wed 18:00 · you're 9th*, a countdown from 18 hours out,
  to Draft › Waivers, which is a view of this tab and lights it (`league-waivers.md`, 19 Oct 2026). With the schedule
  unreadable it still shows, without a time: *Waivers · you're 9th* (20 Oct 2026).
- The ledger (`components/league/Ledger`, no `teamId`, `groupByDay`): **the mover** on his own colour, the type in
  the info ink, who came in, who went out, and a trade's partner; the desk adds a date block on every row. Under a
  thumb a plate prints the league's short name (*DOME*); the desk prints the full one.
- **The type is the league's word** (`kindOf`): *Trade*; *Waiver* for a claim off waivers and its drop; *Free agent*
  for a free agent signed for a drop (Craig, 20 Oct 2026, so this tab and Waivers' Last run agree); *Bin Pick Up*
  and *To The Bin* for a one-sided claim. A claim the feed never said the route of stays *Waiver*.
- **Under a thumb a transfer is two rows** (Craig, 19 Oct 2026: *"transfers tab, we can get each transfer to 2
  rows, on 3 currently"*). Row one is the type, beside **In**; row two is the mover's plate, beside **Out**. **A
  slim day heading** (*Fri 16 Oct*) opens each London day's deals instead of a date block on every row (review
  M-LEAGUE-2, 20 Oct 2026: seven dates printed 43 times), so the left column is only as wide as the type and the
  plate (72px; a team's own tab, the type alone, 64px) and the names have the date's room. A name too long for its
  line wraps rather than cuts (at 320, 84 of 86 were cut), its position tied to the last letter, and a single word
  too long for the box breaks inside it (integration review, 20 Oct: *Gudmundsson* painted over its tag). Words the type cannot fit break onto a second line inside row one. A trade's partner plate
  sits under the mover's behind a faint `With`, the desk's head said on the phone (review UX-8, 19 Oct: two
  plates flush, both green, read as one side), so a trade is the one transfer whose left side runs past two
  lines. The li is a two-column grid below `lg` and the old flex strip from `lg`, each cell placed in the head's
  order with `lg:order-*`; the headings are `lg:hidden` and the desk keeps its Date column, so the desk is
  unchanged. The team Transfers tab groups the same way, its type beside In. Waivers' Last run is one stamp and
  keeps a date block on each row.
- **A man is named as on every list** (UI audit D-12, D-13, 21 Oct 2026): `PlayerName`'s rule, *L. Colwill* under a
  thumb and *Levi Colwill* on a desk, and his positions as the board leads' faint caps label (`positionsLabel`:
  *DEF*, *M/F*), not a bracketed letter, *(D)*, in its own ink.
- **Every name opens his page** (`/players/[fantraxId]`, the id the feed's own row carries), at a tap row's 36px
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
