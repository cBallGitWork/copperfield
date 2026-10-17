import type { PlMoment } from "../../../football/premierleague/moments";
import type { PlShot } from "../../../football/premierleague/momentWords";
import type { ReportMan, ReportMatchInput } from "../types";
import { matchInput, moment, reportMan, shot } from "./built";

// Gameweek 6 of the real league, 10 to 12 Oct 2026, cut from the desk's own event lists: each match's men and the moments
// its shape turns on, with the misses a report might have told. Names and minutes as the feed gave them.

type Man = readonly [name: string, side: "home" | "away", over?: Partial<ReportMan>];
type Moment = readonly [minute: string, kind: PlMoment["kind"], man: string, other?: string | null, over?: { shot?: Partial<PlShot>; injury?: boolean }];

function game(home: string, away: string, men: readonly Man[], moments: readonly Moment[], managers: [string | null, string | null] = [null, null]): ReportMatchInput {
  const built = men.map(([name, side, over], i) => reportMan(i + 1, name, side, over));
  const code = (name: string | null | undefined) => (name == null ? null : (built.find((m) => m.name === name)?.code ?? null));
  const plays = moments.map(([minute, kind, man, other, over]) =>
    moment(minute, kind, [code(man), code(other)], { injury: over?.injury ?? false, ...(over?.shot === undefined ? {} : { shot: shot(over.shot) }) }));
  const scored = (side: "home" | "away") =>
    moments.filter(([, kind, man]) => ["goal", "penalty-goal"].includes(kind) && built.find((m) => m.name === man)?.side === side).length;
  const match = matchInput(built, plays, [scored("home"), scored("away")]);
  return { ...match, home: { code: 11, name: home, shorts: [], nickname: null, manager: managers[0] }, away: { code: 22, name: away, shorts: [], nickname: null, manager: managers[1] } };
}

const off = (at: string, over: Partial<ReportMan> = {}): Partial<ReportMan> => ({ offAt: at, ...over });
const on = (at: string, over: Partial<ReportMan> = {}): Partial<ReportMan> => ({ started: false, onAt: at, ...over });
const CLOSE = { from: "from close range" };
const SIX = { from: "from inside the six-yard box" };

export const LIVERPOOL_CITY = game("Liverpool", "Manchester City", [
  ["Alisson Becker", "home", { line: "G" }], ["Jérémy Jacquet", "home", { expectedGoals: 0.24 }], ["Lewis Koumas", "home", { expectedGoals: 0.1 }],
  ["Bradley Barcola", "home"], ["Ryan Gravenberch", "home", off("62", { sentOff: true })], ["Víctor Muñoz", "home"],
  ["Gianluigi Donnarumma", "away", { line: "G", saves: 6 }], ["Erling Haaland", "away", off("80", { expectedGoals: 0.6 })],
  ["Iliman Ndiaye", "away", off("56")], ["Jérémy Doku", "away", on("56")], ["Elliot Anderson", "away"], ["Rayan Cherki", "away", { expectedGoals: 0.91 }],
  ["Nico O'Reilly", "away", off("66")], ["Josko Gvardiol", "away", on("66")], ["Antoine Semenyo", "away"],
], [
  ["21", "saved", "Jérémy Jacquet", null, { shot: CLOSE }],
  ["33", "saved", "Víctor Muñoz", "Ryan Gravenberch", { shot: { from: "from outside the box" } }],
  ["38", "missed", "Rayan Cherki", "Elliot Anderson"],
  ["48", "saved", "Lewis Koumas", "Bradley Barcola"],
  ["56", "substitution", "Jérémy Doku", "Iliman Ndiaye"],
  ["60", "missed", "Erling Haaland", "Antoine Semenyo", { shot: { supply: "through ball" } }],
  ["62", "second-yellow", "Ryan Gravenberch"],
  ["65", "goal", "Erling Haaland", null, { shot: { foot: "left foot" } }],
  ["66", "substitution", "Josko Gvardiol", "Nico O'Reilly"],
  ["68", "goal", "Jérémy Doku", "Elliot Anderson", { shot: { to: "into the top corner", supply: "pass" } }],
  ["78", "goal", "Rayan Cherki", "Josko Gvardiol", { shot: { ...SIX, supply: "headed pass" } }],
], ["Andoni Iraola", "Enzo Maresca"]);

export const ARSENAL_LEEDS = game("Arsenal", "Leeds United", [
  ["Kai Havertz", "home"], ["Noni Madueke", "home"], ["Riccardo Calafiori", "home"], ["Ben White", "home"], ["Myles Lewis-Skelly", "home", off("63")],
  ["Bruno Guimarães", "home", on("63")], ["Declan Rice", "home"], ["Martin Ødegaard", "home", { expectedGoals: 0.82 }],
  ["James Justin", "away"], ["Gabriel Gudmundsson", "away"],
], [
  ["21", "saved", "Kai Havertz", "Noni Madueke", { shot: { foot: "header", supply: "cross" } }],
  ["55", "goal", "James Justin", "Gabriel Gudmundsson", { shot: { supply: "cross" } }],
  ["62", "goal", "Riccardo Calafiori", "Ben White", { shot: { foot: "left foot", supply: "headed pass" } }],
  ["63", "substitution", "Bruno Guimarães", "Myles Lewis-Skelly"],
  ["70", "goal", "Bruno Guimarães", "Declan Rice", { shot: { from: "from outside the box", supply: "pass" } }],
  ["83", "saved", "Martin Ødegaard", null, { shot: CLOSE }],
], ["Mikel Arteta", "Daniel Farke"]);

export const UNITED_SPURS = game("Manchester United", "Tottenham Hotspur", [
  ["Amad Diallo", "home"], ["Bryan Mbeumo", "home"], ["Matheus Cunha", "home"],
  ["Mohammed Kudus", "away"], ["Sávio", "away"], ["Conor Gallagher", "away"], ["Rodrigo Bentancur", "away", on("66", { offAt: "78", sentOff: true })],
  ["Dominic Solanke", "away"], ["Sandro Tonali", "away"],
], [
  ["21", "missed", "Mohammed Kudus", "Sávio"],
  ["34", "saved", "Amad Diallo", "Bryan Mbeumo"],
  ["42", "saved", "Conor Gallagher", null, { shot: SIX }],
  ["73", "goal", "Bryan Mbeumo", "Matheus Cunha"],
  ["78", "sent-off", "Rodrigo Bentancur"],
  ["90+2", "goal", "Dominic Solanke", "Sandro Tonali", { shot: { foot: "header", supply: "cross" } }],
]);

export const SUNDERLAND_BRIGHTON = game("Sunderland", "Brighton & Hove Albion", [
  ["Thomas Meunier", "home", off("34", { injuredOff: true })], ["Malick Fofana", "home", on("34")],
  ["Pascal Struijk", "away", off("57", { sentOff: true })], ["Olivier Boscagli", "away"], ["Maxim De Cuyper", "away"], ["Pascal Groß", "away"],
  ["Diego Gómez", "away", off("88")], ["Yasin Ayari", "away", off("88")], ["Jaouen Hadjam", "away", on("88")], ["Georginio Rutter", "away", on("88")],
], [
  ["34", "substitution", "Malick Fofana", "Thomas Meunier", { injury: true }],
  ["45+3", "woodwork", "Pascal Struijk", "Olivier Boscagli", { shot: { foot: "header" } }],
  ["53", "goal", "Maxim De Cuyper", "Pascal Groß", { shot: { foot: "left foot" } }],
  ["57", "sent-off", "Pascal Struijk"],
  ["88", "substitution", "Jaouen Hadjam", "Diego Gómez"],
  ["88", "substitution", "Georginio Rutter", "Yasin Ayari"],
  ["90+3", "goal", "Jaouen Hadjam", "Georginio Rutter", { shot: { foot: "left foot", situation: "fast break", supply: "through ball" } }],
]);

export const PALACE_FOREST = game("Crystal Palace", "Nottingham Forest", [
  ["Daichi Kamada", "home"], ["Quinten Timber", "home"], ["Jefferson Lerma", "home"], ["Adam Wharton", "home"], ["Yéremy Pino", "home"],
  ["Dan Ndoye", "away"], ["Morgan Gibbs-White", "away"], ["Liam Delap", "away", { expectedGoals: 1.01 }], ["Neco Williams", "away"],
], [
  ["3", "goal", "Dan Ndoye"],
  ["21", "saved", "Dan Ndoye", "Morgan Gibbs-White", { shot: { ...SIX, foot: "header", supply: "cross" } }],
  ["35", "saved", "Liam Delap", null, { shot: CLOSE }],
  ["41", "goal", "Daichi Kamada", "Quinten Timber", { shot: { foot: "left foot" } }],
  ["45+4", "goal", "Jefferson Lerma", "Adam Wharton", { shot: { ...CLOSE, foot: "header", situation: "corner", supply: "cross" } }],
  ["59", "goal", "Yéremy Pino"],
  ["68", "woodwork", "Neco Williams", null, { shot: { from: "from outside the box" } }],
]);

export const IPSWICH_FULHAM = game("Ipswich Town", "Fulham", [
  ["Jaden Philogene", "home", off("63")], ["Sasa Lukic", "home"], ["Emersonn", "home"], ["Julio Enciso", "home"], ["Jack Clarke", "home", on("63")],
  ["Abdoul Ouattara", "home"], ["Dara O'Shea", "home"],
  ["Ryan Sessegnon", "away"], ["Kenny Tete", "away"], ["Gonzalo García", "away", { expectedGoals: 0.67 }],
], [
  ["19", "saved", "Jaden Philogene", "Sasa Lukic"],
  ["24", "missed", "Ryan Sessegnon", "Kenny Tete", { shot: { ...SIX, foot: "header", supply: "cross" } }],
  ["55", "goal", "Ryan Sessegnon", null, { shot: { from: "from outside the box", foot: "left foot", situation: "corner" } }],
  ["58", "woodwork", "Emersonn", "Julio Enciso", { shot: { foot: "header", supply: "cross" } }],
  ["60", "saved", "Gonzalo García", null, { shot: { foot: "header" } }],
  ["63", "substitution", "Jack Clarke", "Jaden Philogene"],
  ["88", "goal", "Abdoul Ouattara", null, { shot: { from: "from outside the box", foot: "left foot" } }],
  ["90+1", "goal", "Dara O'Shea", "Jack Clarke", { shot: { ...CLOSE, foot: "header", situation: "set piece", supply: "cross" } }],
], ["Kieran McKenna", "Álvaro Arbeloa"]);

export const CHELSEA_BOURNEMOUTH = game("Chelsea", "AFC Bournemouth", [
  ["Jordan Henderson", "home"], ["Cole Palmer", "home"], ["Morgan Rogers", "home"], ["Pedro Neto", "home"], ["João Pedro", "home", { surname: "João Pedro" }], ["Pep Chavarría", "home"],
  ["Evanilson", "away"], ["Rayan", "away"],
], [
  ["2", "goal", "Jordan Henderson", "Cole Palmer", { shot: { from: "from outside the box" } }],
  ["3", "saved", "Pedro Neto", "Cole Palmer"],
  ["3", "goal", "Morgan Rogers", "Jordan Henderson"],
  ["36", "saved", "Rayan", null],
  ["46", "goal", "João Pedro", "Pedro Neto"],
  ["51", "goal", "Evanilson", null, { shot: { ...CLOSE, situation: "corner" } }],
  ["67", "goal", "João Pedro", "Pep Chavarría", { shot: { supply: "cross" } }],
  ["70", "goal", "Jordan Henderson", null, { shot: { from: null } }],
]);

export const HULL_EVERTON = game("Hull City", "Everton", [
  ["Joe Gelhardt", "home", off("65")], ["Sorba Thomas", "home"], ["Ryan Giles", "home", off("64")], ["Elliot Stroud", "home", on("64")],
  ["Mohamed Belloumi", "home", on("65")],
  ["Thierno Barry", "away"], ["James Garner", "away"], ["Brennan Johnson", "away"], ["Kiernan Dewsbury-Hall", "away"], ["Ainsley Maitland-Niles", "away"],
], [
  ["27", "saved", "Thierno Barry", "James Garner", { shot: { ...CLOSE, foot: "header", supply: "cross" } }],
  ["34", "ruled-out", "Brennan Johnson"],
  ["48", "goal", "Joe Gelhardt", "Sorba Thomas", { shot: { foot: "left foot", situation: "fast break", supply: "through ball" } }],
  ["55", "goal", "Kiernan Dewsbury-Hall", "Ainsley Maitland-Niles", { shot: { ...CLOSE, foot: "header", situation: "corner" } }],
  ["64", "substitution", "Elliot Stroud", "Ryan Giles"],
  ["65", "substitution", "Mohamed Belloumi", "Joe Gelhardt"],
  ["68", "goal", "Thierno Barry", "Kiernan Dewsbury-Hall"],
  ["74", "goal", "Mohamed Belloumi", "Elliot Stroud", { shot: { foot: "left foot", to: "into the top corner" } }],
]);

export const VILLA_BRENTFORD = game("Aston Villa", "Brentford", [
  ["Nicolas Jackson", "home"], ["Matteo Ruggeri", "home", off("46", { injuredOff: true })], ["Aaron Wan-Bissaka", "home", on("46")],
  ["John McGinn", "home"], ["Johan Manzambi", "home"],
  ["Yehor Yarmoliuk", "away"], ["Kevin Schade", "away", off("52", { injuredOff: true })], ["Mamadou Sangaré", "away", on("52")],
  ["Kristoffer Ajer", "away"], ["Jaidon Anthony", "away"],
], [
  ["10", "goal", "Yehor Yarmoliuk"],
  ["12", "goal", "Nicolas Jackson"],
  ["46", "substitution", "Aaron Wan-Bissaka", "Matteo Ruggeri", { injury: true }],
  ["52", "substitution", "Mamadou Sangaré", "Kevin Schade", { injury: true }],
  ["77", "goal", "John McGinn", "Johan Manzambi"],
  ["79", "goal", "Kristoffer Ajer", "Jaidon Anthony"],
]);

export const COVENTRY_NEWCASTLE = game("Coventry City", "Newcastle United", [
  ["Carl Rushworth", "home", { line: "G", saves: 4 }], ["Milan van Ewijk", "home", { line: "D", surname: "van Ewijk" }], ["Bobby Thomas", "home", { line: "D" }],
  ["Caleb Yirenkyi", "home", { line: "D" }], ["Jay Dasilva", "home", { line: "D" }], ["Jack Rudoni", "home"], ["Matt Grimes", "home", off("83")],
  ["Sidiki Cherif", "home", off("78", { line: "F" })], ["Brandon Thomas-Asante", "home", { line: "F" }], ["Ellis Simms", "home", on("78", { line: "F" })],
  ["Stephen Mfuni", "home", on("83")], ["Sven Botman", "away", { line: "D" }], ["Nico González", "away"], ["Lewis Hall", "away", { line: "D" }],
], [
  ["6", "penalty-goal", "Jack Rudoni", null, { shot: { foot: "left foot" } }],
  ["48", "goal", "Sidiki Cherif", null, { shot: { from: "from outside the box" } }],
  ["70", "goal", "Sven Botman", "Nico González", { shot: { from: "from outside the box", foot: "left foot", to: "into the top corner" } }],
  ["78", "substitution", "Ellis Simms", "Sidiki Cherif"],
  ["81", "goal", "Ellis Simms", "Brandon Thomas-Asante"],
  ["83", "substitution", "Stephen Mfuni", "Matt Grimes"],
  ["86", "goal", "Stephen Mfuni", "Jay Dasilva", { shot: { foot: "left foot" } }],
], ["Frank Lampard", "Matthias Jaissle"]);
