import { describe, expect, it } from "vitest";
import type { FootballPlayer } from "./football/types";
import type { RosteredPlayer } from "./join/roster";
import footballPlayers from "./join/__fixtures__/footballPlayers.json";
import { fullPlayerName, initialled, nameMatches, pitchName, searchKey, shirtName, spelt, surname } from "./names";

const players = footballPlayers as FootballPlayer[];

// FPL's web names as a row prints them (bootstrap, 16 Oct 2026: 31 glued initials, three glued tails).
describe("shirtName", () => {
  it("puts a space after an initial", () => {
    expect(["J.Timber", "F.Kadıoğlu", "E.Le Fée"].map(shirtName)).toEqual(["J. Timber", "F. Kadıoğlu", "E. Le Fée"]);
  });

  it("parts a tail FPL glued on with a dot", () => {
    expect(["Kroupi.Jr", "Tóth.A", "Jocelin.T"].map(shirtName)).toEqual(["Kroupi Jr", "Tóth A.", "Jocelin T."]);
  });

  it("leaves every other name as FPL spells it", () => {
    expect(["Groß", "O'Reilly", "João Pedro", "Bruno G.", "Iling Jr", "Dewsbury-Hall"].map(shirtName)).toEqual([
      "Groß", "O'Reilly", "João Pedro", "Bruno G.", "Iling Jr", "Dewsbury-Hall",
    ]);
  });
});

describe("initialled", () => {
  it("leaves a shirt name that opens on a surname particle whole", () => {
    expect(initialled("De Ligt")).toBe("De Ligt");
    expect(initialled("Van de Ven")).toBe("Van de Ven");
    expect(initialled("Mac Allister")).toBe("Mac Allister");
  });

  it("puts a forename as an initial before the surname", () => {
    expect(initialled("Kiernan Dewsbury-Hall")).toBe("K. Dewsbury-Hall");
    expect(initialled("Virgil van Dijk")).toBe("V. van Dijk");
    expect(initialled("Senne Lammens")).toBe("S. Lammens");
  });

  it("reads Fantrax's surname-first form", () => {
    expect(initialled("Gross, Pascal")).toBe("P. Gross");
    expect(initialled("De Cuyper, Maxim")).toBe("M. De Cuyper");
    expect(initialled("Rodri, ")).toBe("Rodri");
  });

  it("leaves a name that is already short", () => {
    expect(initialled("Rodri")).toBe("Rodri");
    expect(initialled("B.Fernandes")).toBe("B. Fernandes");
    expect(initialled("Bruno G.")).toBe("Bruno G.");
    expect(initialled("Matheus N.")).toBe("Matheus N.");
    expect(initialled("E.Le Fée")).toBe("E. Le Fée");
  });

  it("never initials a suffix as though it were a forename", () => {
    expect(["Iling Jr", "Kroupi.Jr", "Tóth.A"].map(initialled)).toEqual(["Iling Jr", "Kroupi Jr", "Tóth A."]);
  });

  it("prints a man with one name whole (Craig, 11 Oct 2026)", () => {
    expect(["Gonzalo", "Rayan", "Gonzalo "].map(initialled)).toEqual(["Gonzalo", "Rayan", "Gonzalo"]);
  });

  it("keeps an accented initial whole", () => {
    expect(initialled("Łukasz Fabiański")).toBe("Ł. Fabiański");
  });
});

describe("surname", () => {
  it("keeps a particle whatever its case", () => {
    expect(["Enzo Le Fée", "Maxim De Cuyper", "Jan Paul van Hecke", "Sávio"].map((name) => surname(name))).toEqual(["Le Fée", "De Cuyper", "van Hecke", "Sávio"]);
  });

  // The Premier League's own name parts, as its team sheets gave them on 10 and 11 Oct 2026.
  it("prints a compound surname, and a man known by his forenames, whole, as the club names him", () => {
    expect(surname("João Pedro", { first: "João Pedro", last: "Junqueira de Jesus" })).toBe("João Pedro");
    expect(surname("Jørgen Strand Larsen", { first: "Jørgen", last: "Strand Larsen" })).toBe("Strand Larsen");
    expect(surname("Matthijs de Ligt", { first: "Matthijs", last: "de Ligt" })).toBe("de Ligt");
    expect(surname("Alexis Mac Allister", { first: "Alexis", last: "Mac Allister" })).toBe("Mac Allister");
  });

  it("keeps the name a man plays under when the club's legal surname is longer", () => {
    expect(surname("Bruno Fernandes", { first: "Bruno Miguel", last: "Borges Fernandes" })).toBe("Fernandes");
    expect(surname("Sávio", { first: "Sávio", last: "Moreira de Oliveira" })).toBe("Sávio");
  });
});

// The name a list column shows, which is neither of FPL's two fields.
describe("fullPlayerName", () => {
  const man = (fullName: string, name: string): RosteredPlayer => ({
    slot: { fantraxId: "x", position: "M", status: "ACTIVE" },
    player: { ...players[0], fullName, name },
    stats: [],
  });

  it("joins the forename to the shirt name", () => {
    // Fantrax's own roster says "Matheus Cunha", and this arrives at it from
    // FPL's two fields — the pool carries their spelling and the ROSTER does
    // not, so it cannot simply be read.
    expect(fullPlayerName(man("Matheus Santos Carneiro da Cunha", "Cunha"))).toBe("Matheus Cunha");
    expect(fullPlayerName(man("Rodrigo Muniz Carvalho", "Muniz"))).toBe("Rodrigo Muniz");
  });

  it("leaves a name FPL has already disambiguated", () => {
    // A dot or a space in the shirt name means FPL is separating two players
    // who share a surname. Prefixing would give "Bruno B.Fernandes".
    expect(fullPlayerName(man("Bruno Borges Fernandes", "B.Fernandes"))).toBe("B. Fernandes");
    expect(fullPlayerName(man("Junior Kroupi", "Kroupi.Jr"))).toBe("Kroupi Jr");
    expect(fullPlayerName(man("Jair Paula da Cunha Filho", "Jair Cunha"))).toBe("Jair Cunha");
  });

  it("does not double a name when the accents differ", () => {
    // Yéremy Pino Santos, web_name "Yeremy": FPL strips the shirt name's accent, and an exact compare read "Yéremy Yeremy".
    expect(fullPlayerName(man("Yéremy Pino Santos", "Yeremy"))).toBe("Yeremy");
  });

  it("still prefixes a forename when the accented name is genuinely different", () => {
    // The fold must not swallow a real surname: Hincapié's shirt name is his
    // surname unaccented, and he still wants his forename in a list column.
    expect(fullPlayerName(man("Piero Hincapié", "Hincapie"))).toBe("Piero Hincapie");
  });

  it("leaves a one-word player alone", () => {
    expect(fullPlayerName(man("Rodrigo 'Rodri' Hernandez Cascante", "Rodrigo"))).toBe("Rodrigo");
  });

  it("answers with the id when the bridge has not settled him", () => {
    expect(fullPlayerName({ slot: { fantraxId: "078wl", position: "G", status: "ACTIVE" }, unresolved: "unmapped" })).toBe("078wl");
  });
});

// The name on a pitch card, from FPL's shirt name and his full name (FPL's web names, 11 Oct 2026).
describe("pitchName", () => {
  it("cuts his own forename to an initial", () => {
    expect(pitchName({ name: "George Hemmings", fullName: "George Hemmings" })).toBe("G.Hemmings");
    expect(pitchName({ name: "Pedro Porro", fullName: "Pedro Porro Sauceda" })).toBe("P.Porro");
    expect(pitchName({ name: "Fábio Vieira", fullName: "Fabio Ferreira Vieira" })).toBe("F.Vieira");
  });

  it("leaves a surname of two words whole", () => {
    // 13 of FPL's 667 web names were garbled: "M.Allister", "S.Rowe", "D.Ligt".
    expect(pitchName({ name: "Mac Allister", fullName: "Alexis Mac Allister" })).toBe("Mac Allister");
    expect(pitchName({ name: "Smith Rowe", fullName: "Emile Smith Rowe" })).toBe("Smith Rowe");
    expect(pitchName({ name: "De Ligt", fullName: "Matthijs de Ligt" })).toBe("De Ligt");
    expect(pitchName({ name: "Iling Jr", fullName: "Samuel Iling-Junior" })).toBe("Iling Jr");
    expect(pitchName({ name: "Kroupi.Jr", fullName: "Junior Kroupi" })).toBe("Kroupi Jr");
  });

  it("leaves a name FPL has already shortened", () => {
    expect(pitchName({ name: "Salah", fullName: "Mohamed Salah" })).toBe("Salah");
    expect(pitchName({ name: "B.Fernandes", fullName: "Bruno Borges Fernandes" })).toBe("B.Fernandes");
    expect(pitchName({ name: "Matheus N.", fullName: "Matheus Nunes" })).toBe("Matheus N.");
  });

  it("initials a bare full name, as the Premier League's sheet spells him", () => {
    expect(pitchName({ name: "Bukayo Saka" })).toBe("B.Saka");
  });

  it("answers a rostered slot through his footballer, or his id", () => {
    const slot = { fantraxId: "078wl", position: "M", status: "ACTIVE" } as const;
    const player = { ...players[0], name: "Mac Allister", fullName: "Alexis Mac Allister" };
    expect(pitchName({ slot, player, stats: [] })).toBe("Mac Allister");
    expect(pitchName({ slot, unresolved: "unmapped" })).toBe("078wl");
  });
});

// Fantrax's spelling against FPL's, as the 16 Oct 2026 review found them on one screen.
describe("spelt", () => {
  const fpl = (name: string, fullName: string) => ({ ...players[0], name, fullName });

  it("takes FPL's accents and apostrophes for the same name", () => {
    expect(spelt("Pascal Gross", fpl("Groß", "Pascal Groß"))).toBe("Pascal Groß");
    expect(spelt("Joao Pedro", fpl("João Pedro", "João Pedro Junqueira de Jesus"))).toBe("João Pedro");
    expect(spelt("Nico OReilly", fpl("O'Reilly", "Nico O'Reilly"))).toBe("Nico O'Reilly");
  });

  it("keeps Fantrax's name where FPL's is another one", () => {
    expect(spelt("Bruno Fernandes", fpl("B.Fernandes", "Bruno Borges Fernandes"))).toBe("Bruno Fernandes");
    expect(spelt("Eli Kroupi", fpl("Kroupi.Jr", "Junior Kroupi"))).toBe("Eli Kroupi");
  });
});

describe("searchKey", () => {
  const finds = (name: string, typed: string) => searchKey(name).includes(searchKey(typed));

  it("folds accents and the letters NFD cannot split, on both sides", () => {
    expect(finds("Martin Odegaard", "Ødegaard")).toBe(true);
    expect(finds("Martin Ødegaard", "odegaard")).toBe(true);
    expect(finds("Pascal Gross", "Groß")).toBe(true);
    expect(finds("Viktor Gyokeres", "Gyökeres")).toBe(true);
    expect(finds("Amadou Sangare", "Sangaré")).toBe(true);
    expect(finds("Joao Pedro", "João")).toBe(true);
    expect(finds("Marc Guehi", "Guéhi")).toBe(true);
  });

  it("drops apostrophes of both kinds, hyphens and spaces", () => {
    expect(finds("Nico OReilly", "O'Reilly")).toBe(true);
    expect(finds("Nico OReilly", "O’Reilly")).toBe(true);
    expect(finds("Nico O'Reilly", "oreilly")).toBe(true);
    expect(finds("Aaron Wan-Bissaka", "Wan Bissaka")).toBe(true);
    expect(finds("Kiernan Dewsbury-Hall", "Dewsbury Hall")).toBe(true);
    expect(finds("Alexis Mac Allister", "MacAllister")).toBe(true);
  });

  it("still tells two names apart", () => {
    expect(finds("Bukayo Saka", "salah")).toBe(false);
  });
});

describe("nameMatches", () => {
  it("finds a man by every word typed, in any order, initialled or surname first", () => {
    expect(nameMatches("Bukayo Saka", "B. Saka")).toBe(true);
    expect(nameMatches("Bukayo Saka", "saka bukayo")).toBe(true);
    expect(nameMatches("Bruno Fernandes", "B.Fernandes")).toBe(true);
    expect(nameMatches("Pascal Groß", "Gross, Pascal")).toBe(true);
  });

  it("folds as the search key does, and runs a word on across the next", () => {
    expect(nameMatches("Virgil van Dijk", "van dijk")).toBe(true);
    expect(nameMatches("Virgil van Dijk", "vandijk")).toBe(true);
    expect(nameMatches("Aaron Wan-Bissaka", "Wan Bissaka")).toBe(true);
    expect(nameMatches("Martin Ødegaard", "odeg")).toBe(true);
    expect(nameMatches("Nico O'Reilly", "O’Reilly")).toBe(true);
  });

  it("wants each typed word at the start of one of his", () => {
    expect(nameMatches("Aaron Wan-Bissaka", "B. Saka")).toBe(false);
    expect(nameMatches("Bukayo Saka", "salah")).toBe(false);
  });

  it("finds anyone for nothing typed", () => {
    expect(nameMatches("Bukayo Saka", " ")).toBe(true);
  });
});
