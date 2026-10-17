// A club's name as a newspaper sets it, from FPL's short `name`; a club not listed prints FPL's own.

const FULL: Record<string, string> = {
  "Nott'm Forest": "Nottingham Forest",
  "Man City": "Manchester City",
  "Man Utd": "Manchester United",
  Spurs: "Tottenham Hotspur",
  Wolves: "Wolverhampton Wanderers",
  Newcastle: "Newcastle United",
  Brighton: "Brighton & Hove Albion",
  Bournemouth: "AFC Bournemouth",
  "West Ham": "West Ham United",
  Leeds: "Leeds United",
};

export function fullClubName(name: string): string {
  return FULL[name] ?? name;
}

/** The second references a paper allows after the full name ("Tottenham", "Spurs"); none when the full name is already short. */
const SHORT: Record<string, string[]> = {
  Spurs: ["Tottenham", "Spurs"],
  "Aston Villa": ["Villa"],
  "Nott'm Forest": ["Forest"],
  "Man City": ["City"],
  "Man Utd": ["United"],
  "Crystal Palace": ["Palace"],
  Newcastle: ["Newcastle"],
  Brighton: ["Brighton"],
  Wolves: ["Wolves"],
  "West Ham": ["West Ham"],
  Leeds: ["Leeds"],
  "Coventry City": ["Coventry"],
  "Hull City": ["Hull"],
  "Ipswich Town": ["Ipswich"],
};

export function shortClubNames(name: string): string[] {
  return SHORT[name] ?? [];
}

/** The nickname a British paper uses as a second reference, by FPL's short name: Craig, 13 Oct 2026. City, Forest
 *  and Wolves are already their short names; Liverpool's "the Reds" is United's and Forest's too, so it is left out. */
const NICKNAME: Record<string, string> = {
  Arsenal: "the Gunners",
  "Aston Villa": "the Villans",
  Bournemouth: "the Cherries",
  Brentford: "the Bees",
  Brighton: "the Seagulls",
  Burnley: "the Clarets",
  Chelsea: "the Blues",
  "Coventry City": "the Sky Blues",
  "Crystal Palace": "the Eagles",
  Everton: "the Toffees",
  Fulham: "the Cottagers",
  "Hull City": "the Tigers",
  "Ipswich Town": "the Tractor Boys",
  Leeds: "the Whites",
  Leicester: "the Foxes",
  "Man Utd": "the Red Devils",
  Middlesbrough: "Boro",
  Newcastle: "the Magpies",
  Norwich: "the Canaries",
  "Sheffield Utd": "the Blades",
  Southampton: "the Saints",
  Spurs: "the Lilywhites",
  Sunderland: "the Black Cats",
  Watford: "the Hornets",
  "West Brom": "the Baggies",
  "West Ham": "the Hammers",
};

export function clubNickname(name: string): string | null {
  return NICKNAME[name] ?? null;
}

/** Every nickname as a paper prints it, after its club: "Arsenal, the Gunners". */
export const NICKNAMES: readonly string[] = Object.entries(NICKNAME).map(([name, nickname]) => `${fullClubName(name)}, ${nickname}`);
