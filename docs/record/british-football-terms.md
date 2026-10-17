# UK football vocabulary for the paper's writers

A dated research record (13 Oct 2026). What it led to is in `gazette/british.ts`, `voice/house.ts`'s `BRITISH` and
`clubNames.ts`; §0's three findings are fixed (#507 and the shared list).

Researched 13 Oct 2026. The BBC and Guardian sites refused the fetcher, so quotes come from Sky Sports match reports, PA copy (via the Irish Examiner) and Fantasy Football Scout, all for 2026/27. Checked against `SHEETS_AMERICAN`, `SHEETS_STOCK`, `REPORT_*`, `DRAFT_*`, `BANNED`, `DESK_BANNED` and Lawro's lists.

## 0. Three findings in the existing lists

1. **`scripts/edition/voice/draft.ts:32` tells the writer to say "kept a shut-out".** That is the owner's first banned word. Only the unhyphenated `shutout` is listed, so "shut-out" passes the check. Change the line to "kept a clean sheet" and add `shut-out`/`shut-outs`.
2. **"lean on", "step up" and "show up" are banned only for Lawro.** They live in `predictions/words.ts`'s private `AMERICAN` list, which is not part of `banned.ts`'s `AMERICAN` (`SHEETS_AMERICAN + REPORT_AMERICAN`). The draft report and the team sheets therefore never check for them. Move them into `SHEETS_AMERICAN`.
3. **Some listed "American" words are standard in British copy.** The house can still ban them for style, but the send-back should not call them American:
   - `extra time` is the British term for cup ties; overtime is the American one.
   - `chalked up` appears in PA copy: "The Wearsiders chalked up an 18th Premier League game without a victory" (irishexaminer.com/sport/soccer/arid-41910217.html).
   - `winless` appears in Sky copy: "when they visit winless Tottenham next Monday" (skysports.com/football/coventry-city-vs-newcastle-united/6150385348226459232).
   - `shot-stopper`, `goalie`, `notched` and `standout` are all common in UK writing. PA has "Raya produced another stand out block".
   - The hyphenated `match-ups` is Scout's own word: "'Head-to-Head' pairs off teams in weekly match-ups". It already passes, because whole-word matching does not catch it.

## 1. American terms to ban (not yet listed)

| American | British |
|---|---|
| shut-out, shut out (a side) | clean sheet; kept them out |
| tie game, tied game, ended in a tie, played to a tie, knotted | draw, drew, level |
| two-nothing, one-nothing, nothing-nothing | 2-0, 1-0, goalless / 0-0 |
| field player | outfield player |
| jersey(s) | shirt(s) |
| fullback, wingback, outside back | full-back, wing-back |
| end line, endline | byline |
| bicycle kick | overhead kick |
| in regulation, regulation time | in normal time, in the 90 minutes |
| hat trick | hat-trick |
| playoff(s), postseason, regular season | play-off(s); (none) |
| loss/losses as the noun for a result ("road loss", "home loss", "suffered a loss") | defeat |
| win-loss, winning record, losing record | won four, lost two |
| first place, last place | top, bottom |
| games back, games behind, magic number | points behind, points clear |
| home stand, homestand, road loss, road record, road form | run of home games, away record, away form |
| franchise, front office, general manager, ownership group | club, the boardroom, director of football, the owners |
| MVP, all-star, player of the game | man of the match, player of the match |
| rookie (listed), sophomore | first season, second season |
| three-peat | a third title in a row (and never printed under `COUNTED`) |
| role player, bench player, sixth man | squad player |
| healthy scratch, injured reserve, DNP, season-ending | left out, out for the season, did not play |
| practice / at practice / missed practice (training sense) | training |
| playmaking, make plays, made plays, big play | created chances; laid on |
| insurance goal, garbage time, dagger, walk-off, buzzer-beater | a third goal; late on |
| blowout (listed), laugher, barn-burner, slugfest, squeaker | thrashing (banned as hype), a narrow win |
| posted / put up / erupted for / exploded for (points) | scored, returned |
| logged (minutes) | played |
| stat line, box score, stat sheet | the figures (or nothing) |
| playbook, game plan as a noun for tactics, Hail Mary, slam dunk, home run, curveball, out of left field, ballgame, full-court press | plain words |
| this fall, in the fall | this autumn |
| a couple games/weeks/minutes | a couple of |
| through (Saturday through Monday) | to, or until |
| awesome, guys | (cut) |

General American sports idioms to cut, with their status:
- **"Team" with a singular verb** is a grammar rule (§4), not a word.
- **"on the road"** is listed. **"upset"** is British too, but over-used, so cap it at one a page as Lawro's list does.
- **"dominate"/"dominated"** is listed for Lawro and in the verdicts; add `dominant`/`domination` to the report verdicts.
- **"clutch"** is listed.
- **"playmaker"** means a creative midfielder in British use. Keep the noun and ban the American "make plays" family.

## 2. British match-report vocabulary (2026/27 copy)

**Goals**
- "Simms restored the hosts' two-goal lead with his first touch 11 minutes later" (Sky, Coventry 4-1 Newcastle).
- "Guimaraes slams Arsenal in front after being teed up by Rice's flick" (skysports.com/football/arsenal-vs-leeds-united/6597748919932588232).
- "Solanke glanced a header past a static Senne Lammens" and "rewarded with a leveller in stoppage time" (skysports.com/football/manchester-united-vs-tottenham-hotspur/7654262564534979232).
- Other usable phrases: opener, leveller, equaliser, second, a brace, a hat-trick, from 12 yards, from the spot, from 20 yards, at the far/back post, in off the post.

**Near-misses**
- "curls just wide of the far corner" (Arsenal v Leeds).
- "balloons over from six yards out" (Man Utd v Spurs).
- "Haaland misses a golden chance" (skysports.com/football/liverpool-vs-manchester-city/6930660155686911232).
- "Timber's header was ruled out for offside" (PA).
- Also: hit the bar/post, the woodwork, cleared off the line, went close.

**Saves**
- "Raya dived full-length low to his left to push the attempt onto the post" (PA).
- "David Raya made four saves to deny the Whites" (Sky).
- "his low shot is easily saved by Kinsky" (Sky).
- Also: kept out, turned round the post, tipped over, pushed wide.

**Clean sheets**
- "to deny the leaky Blues a clean sheet" (skysports.com/football/chelsea-vs-bournemouth/7344304273628933232).
- Also: kept a clean sheet; did not concede; a goalless draw.

**Results and margins**
- "Chelsea thumped Bournemouth 5-1" (Sky).
- "Tottenham rescued an unlikely point at Manchester United" (Sky).
- "a second consecutive 4-1 away defeat" (Sky, Coventry).
- Also: won 2-1, drew 1-1, lost 2-0 (the winner's figure always first), a one-goal win, a point, all three points.

**Form and runs**
- "Coventry made it back-to-back Premier League wins" (Sky).
- "seal a ninth consecutive league win" (PA).
- "Everton are still unbeaten after six games" (skysports.com/football/hull-city-vs-everton/6613799548565052232).
- "without a league victory since May" (Sky). The house `COUNTED` rule limits these.

**The table**
- "move level on points with leaders Manchester City at the top" (Sky, Arsenal v Leeds).
- "out of the relegation zone" (Sky, Coventry).
- "lifts Spurs off the foot of the table" (Sky).
- "to go fifth in the early Premier League table" (Sky, Chelsea).

**Substitutes and selection**
- "Guimaraes, on as a substitute for Myles Lewis-Skelly" (PA).
- "the brave call to play Noni Madueke at left wing over Eberechi Eze" (Sky).
- "a triple substitution" (Sky).

**Injuries** (fantasyfootballscout.co.uk/2026/10/13/szoboszlai-isak-gakpo-latest-fpl-team-news-ahead-of-gameweek-7)
- "Long-term absentees Hugo Ekitike (Achilles), Conor Bradley (knee) ... also remain out"
- "Amadou Onana (knee) is still sidelined"
- "remain out but are at least on the grass"
- "suspended for Gameweek 7"
- "three-match domestic ban"

**Managers**
- "Enzo Maresca's men had to weather the storm" (Sky).
- "The Spaniard's first-half caution for venturing out of his technical area" (PA; the house's `REPORT_NOT_HIS_NAME` bans "The Spaniard").
- Use manager, or the club's title where it gives one (Spurs: head coach). Never "coach" alone.

## 3. British fantasy vocabulary

Scout, 2026/27 (fantasyfootballscout.co.uk/2026/10/13/fpl-notes-4-9m-midfielder-on-pens-4-0m-defcon-king-thomas; …/why-havent-the-fpl-auto-subs-been-processed-yet; …/2026/08/10/fpl-draft-ranking-the-100-best-picks-for-2026-27):
- "He responded with a 12-point haul"
- "on course for a double-digit haul"
- "blanked but registered an encouraging three shots"
- "a few routes to points"
- "haven't been auto-subbed out"
- "Smooth: Green arrow."
- "A round of waivers runs once a week"
- "trade players with a rival manager"
- "a 'snake draft' format"

**Fits a head-to-head draft league:**
- haul, double-digit haul, blank/blanked
- returns. The house limits the meaning and bans "attacking returns".
- auto-sub / auto-subbed, always hyphenated as Scout prints it.
- points left on the bench. In H2H they count for nothing, which is the joke.
- free agent, waivers, waiver claim, trade, snake draft, draft pick, match-up (hyphenated)
- won the match-up 54-41
- double gameweek and blank gameweek. These do apply, but "blank gameweek" clashes with a player's blank, so prefer "no fixture".
- minutes, rotation, came off the bench

**FPL-only, wrong in a draft:**
- captain, vice-captain, TC / triple captain
- chips: Bench Boost, Free Hit, Wildcard
- price rises and falls, £m, itb, hits (-4), roll / free transfers
- template, ownership, EO, differential. In a draft every player is unique.
- green arrow, red arrow, overall rank, mini-league

## 4. Grammar and style

- **Clubs and sides take plural verbs:** "Everton are still unbeaten", "Arsenal move level". The house could check this with a regex: `\b(Arsenal|Chelsea|…|the side|the visitors|the hosts) (is|has|was)\b`. A fantasy side named after a man ("Craig's XI") is plural too.
- **Dates:** Saturday 10 October, with no comma and no ordinal suffix. Reject `October 10`, `10th October` and `10/10`.
- **Scores:** a hyphen, as in 2-1, with the winner's figure first ("lost 2-1", never "lost 1-2"). A draw is 1-1. Write goalless, not 0-0, in prose.
- **Numerals:** one to nine as words, 10 and up as figures. Scores, points, yards and ages are always figures. A sentence never opens with a figure ("Eighteen-year-old summer signing Mfuni", Sky).
- **Minutes:** "in the 81st minute", "nine minutes from time", "in stoppage time". Never 81'.
- **Spelling:** -ise and -yse (equaliser, criticised, analyse); -our; -re; travelled; fulfil; skilful; grey; manoeuvre; ageing; programme; licence (noun) and license (verb); practice (noun) and practise (verb); defence and offence.

## 5. Chatbot and cliché tells not yet listed

- **Inflected forms the lists miss:** showcased, showcasing, boasted, boasting, underlines, underscores, highlights, highlighting.
- **Stock phrases:** bolstered, spearheaded, orchestrated, cemented, solidified, played a key role, played a vital role, a key cog, proved his worth, showed his class, a solid outing, steadied the ship, weathered the storm, rounded off, capped off, topped off, all in all, when the dust settled, for what it's worth, it is what it is, silver lining, on the flip side, to add insult to injury, to make matters worse, as luck would have it, safe to say, unsurprisingly, a stark reminder, emphatic, resounding, funny old game, the beautiful game, dream debut, fairytale, you couldn't script it, wrote the script, plot twist, spoiler, fast forward, cue, enter, iconic, legendary, GOAT.
- **Structure:** a sentence opening with "And" or "But" twice in a piece, and "X. Y. Z." staccato fragments. Dashes, triplets and questions are already covered.

## 6. Recommended additions (deduplicated)

```ts
// SHEETS_AMERICAN additions
"shut-out", "shut-outs", "tie game", "tied game", "ended in a tie", "played to a tie", "knotted",
"two-nothing", "one-nothing", "three-nothing", "field player", "jersey", "jerseys", "fullback", "fullbacks",
"wingback", "wingbacks", "outside back", "end line", "endline", "bicycle kick", "in regulation", "regulation time",
"hat trick", "playoff", "playoffs", "postseason", "regular season", "win-loss", "winning record", "losing record",
"games back", "games behind", "magic number", "homestand", "home stand", "road loss", "road record", "road form",
"franchise", "franchises", "front office", "general manager", "ownership group", "MVP", "all-star", "player of the game",
"sophomore", "three-peat", "role player", "bench player", "sixth man", "healthy scratch", "injured reserve", "DNP",
"at practice", "missed practice", "playmaking", "make plays", "made plays", "big play", "insurance goal",
"garbage time", "dagger", "walk-off", "buzzer-beater", "laugher", "barn-burner", "slugfest", "squeaker",
"erupted for", "exploded for", "logged", "stat line", "statline", "box score", "stat sheet", "playbook",
"Hail Mary", "slam dunk", "home run", "curveball", "out of left field", "ballgame", "full-court press",
"this fall", "in the fall", "a couple games", "a couple weeks", "a couple minutes", "awesome",
"lean on", "leans on", "leaning on", "step up", "steps up", "stepped up", "show up", "shows up", "showed up",
// spelling
"analyze", "analyzed", "paralyzed", "behavior", "endeavor", "humor", "harbor", "neighbors", "honors", "honored",
"colored", "favored", "favorable", "theater", "catalog", "fiber", "meter", "aging", "maneuver", "jewelry",
"defenses", "offenses", "programs", "skeptical", "modeling", "traveler", "leveling", "labeling", "fueling",

// REPORT_VERDICTS additions
"dominant", "domination", "emphatic", "resounding",

// REPORT_TELLS additions
"showcased", "showcasing", "boasted", "boasting", "underlines", "underscores", "highlights", "highlighting",
"bolstered", "spearheaded", "orchestrated", "cemented", "solidified", "played a key role", "played a vital role",
"a key cog", "proved his worth", "showed his class", "a solid outing", "steadied the ship", "weathered the storm",
"rounded off", "capped off", "topped off", "all in all", "when the dust settled", "for what it's worth",
"it is what it is", "silver lining", "on the flip side", "to add insult to injury", "to make matters worse",
"as luck would have it", "safe to say", "unsurprisingly", "a stark reminder", "funny old game", "the beautiful game",
"dream debut", "fairytale", "couldn't script it", "wrote the script", "plot twist", "spoiler", "fast forward", "iconic",
"legendary", "GOAT",

// REPORT_FPL additions (draft has none of these)
"vice-captain", "Free Hit", "itb", "green arrow", "red arrow", "overall rank", "mini-league", "effective ownership",
"price rise", "price fall", "free transfer", "points hit",
```

```ts
// REPORT_PENCIL additions: one right answer each
[/\bshut-?outs?\b/gu, "clean sheet"], [/\bhat trick\b/gu, "hat-trick"], [/\bfull ?back\b/gu, "full-back"],
[/\bwing ?back\b/gu, "wing-back"], [/\bauto ?sub/gu, "auto-sub"],
```

**Do not add these, because they would flag good British copy:**
- `tie`: a cup tie.
- `practice` alone: the British noun, "in practice".
- `loss`: loss of form.
- `fall`: a fall in the table.
- `posted`, `put up`, `dropped` (dropped from the side), `went off` (substituted or injured).
- `schedule` (a Fantrax word), `clinch`, `upset` (cap it instead), `veteran`.
- `guy`/`guys` (a first name).
- `jersey`: the island is rare, but bear it in mind.
- `first place`: Scout uses it for draft order. Ban only "in first place".
- `offensive`: the chant sense.
- `license`: correct as a British verb.
- `cue`/`enter`: too common. Check them only sentence-initially (`^Cue\b`, `^Enter\b`).

The existing `sat` already flags "sat on the bench", which is British. Note also that `logged` would catch "logged off"; that is acceptable here.
