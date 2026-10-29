import { LEAGUE_TIMEZONE, MS_PER_DAY, MS_PER_HOUR, wallClockInstant } from "@epl/core";

// What should have run by now and has not: the watchdog's verdict, pure, so a test can stand at any hour.

/** A run as `gh run list --json displayTitle,status,conclusion,createdAt` lists it. */
export interface Run {
  displayTitle: string;
  status: string;
  conclusion: string;
  createdAt: string;
}

/** What to alert, under the source whose issue it belongs to (`scripts/ci/alert.sh`). */
export interface Finding {
  source: string;
  message: string;
}

/** A window a job owes a report in: from `start` on one of `weekdays` (0 is Sunday), by `due`, wall-clock in `zone`. */
export interface Slot {
  weekdays: readonly number[];
  start: string;
  due: string;
  zone: string;
}

/** A scheduled workflow and the success it owes: one within `within` hours, or one inside its daily `slot`. */
export type WorkflowRule = { workflow: string; within: number } | { workflow: string; slot: Slot };

/** A launchd job on the Mac, which reports through an alert.yml run named `alert <source> ok|fail`. */
export interface MacRule {
  source: string;
  slots: readonly Slot[];
}

const EVERY_DAY = [0, 1, 2, 3, 4, 5, 6];

/** Every scheduled workflow but this one; a test holds the list to `.github/workflows`. Dailies get 30h: crons run late. */
export const WORKFLOW_RULES: readonly WorkflowRule[] = [
  { workflow: "capture.yml", within: 30 },
  { workflow: "capture-status.yml", within: 30 },
  { workflow: "ingest-stats.yml", within: 30 },
  { workflow: "intel-check.yml", within: 30 },
  // Its longest gap is Tuesday 22:30 to Wednesday 17:00 UTC.
  { workflow: "editions.yml", within: 30 },
  { workflow: "scout-xi.yml", within: 26 },
  // The 07:20 UTC sweep rates the night's match day; it owes a success by 10:00.
  { workflow: "ratings.yml", slot: { weekdays: EVERY_DAY, start: "07:00", due: "10:00", zone: "UTC" } },
  // 07:25, 13:25 and 19:25 UTC; its longest gap is 19:25 to 07:25.
  { workflow: "health.yml", within: 14 },
  // Hourly at :23, 07–19 UTC; its longest gap is 19:23 to 07:23.
  { workflow: "bench-order.yml", within: 14 },
];

/** The watchdog itself, checked from capture-status.yml so it is not its own only witness. */
export const WATCHDOG_RULE: WorkflowRule = { workflow: "watchdog.yml", within: 5 };

/** `scripts/install-intel-jobs.sh`'s slots, London time; a fail counts as ran, because it has been reported. */
export const MAC_RULES: readonly MacRule[] = [
  { source: "intel-weekly", slots: [{ weekdays: [2], start: "08:00", due: "12:00", zone: LEAGUE_TIMEZONE }] },
  {
    source: "intel-pressers",
    slots: [
      { weekdays: [4], start: "16:00", due: "18:00", zone: LEAGUE_TIMEZONE },
      { weekdays: [4], start: "17:15", due: "18:15", zone: LEAGUE_TIMEZONE },
      { weekdays: [5], start: "12:30", due: "14:00", zone: LEAGUE_TIMEZONE },
      { weekdays: [5], start: "14:00", due: "15:00", zone: LEAGUE_TIMEZONE },
      // Friday's conferences, which the 16:30 Team Sheet files from.
      { weekdays: [5], start: "15:45", due: "16:30", zone: LEAGUE_TIMEZONE },
      { weekdays: [5], start: "17:45", due: "18:30", zone: LEAGUE_TIMEZONE },
    ],
  },
];

/** The instant the watchdog stands at: now, `+<n>h` from now, or an ISO instant, for a test run by hand. */
export function standAt(input: string, real: number): number {
  const text = input.trim();
  if (text === "") return real;
  const ahead = /^\+(\d+)h$/.exec(text);
  if (ahead !== null) return real + Number(ahead[1]) * MS_PER_HOUR;
  const at = Date.parse(text);
  if (Number.isNaN(at)) throw new Error(`now must be an ISO instant or +<hours>h, not "${input}"`);
  return at;
}

/** A wall-clock time on a calendar day in `zone`, as an instant. */
function wallClock(day: string, time: string, zone: string): number {
  return wallClockInstant(Date.parse(`${day}T${time}:00Z`), zone);
}

function dayIn(at: number, zone: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit" }).format(at);
}

interface Opened {
  start: number;
  due: number;
  slot: Slot;
}

/** Every slot opened in the last week. */
function opened(slots: readonly Slot[], now: number): Opened[] {
  const out: Opened[] = [];
  for (let back = 0; back <= 7; back++) {
    for (const slot of slots) {
      const day = dayIn(now - back * MS_PER_DAY, slot.zone);
      if (!slot.weekdays.includes(new Date(`${day}T12:00:00Z`).getUTCDay())) continue;
      const start = wallClock(day, slot.start, slot.zone);
      if (start <= now) out.push({ start, due: wallClock(day, slot.due, slot.zone), slot });
    }
  }
  return out;
}

/** Of `slots`, those whose deadline has passed at `at`, latest deadline first. */
function pastDue(slots: readonly Opened[], at: number): Opened[] {
  return slots.filter((one) => one.due <= at).sort((a, b) => b.due - a.due);
}

function utc(at: number): string {
  return `${new Date(at).toISOString().slice(0, 16).replace("T", " ")} UTC`;
}

function sourceOf(workflow: string): string {
  return workflow.replace(/\.ya?ml$/, "");
}

function workflowFindings(rule: WorkflowRule, runs: readonly Run[], now: number): Finding[] {
  const seen = runs.filter((run) => Date.parse(run.createdAt) <= now).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const source = sourceOf(rule.workflow);
  const found: Finding[] = [];
  if (seen[0]?.conclusion === "startup_failure") {
    found.push({ source, message: `${rule.workflow}'s latest run, at ${utc(Date.parse(seen[0].createdAt))}, never started (startup_failure).` });
  }
  const success = seen.find((run) => run.conclusion === "success");
  const last = success === undefined ? null : Date.parse(success.createdAt);
  const since = last === null ? "has no success among its recent runs" : `last succeeded at ${utc(last)}`;
  if ("within" in rule) {
    if (last === null || last < now - rule.within * MS_PER_HOUR) {
      found.push({ source, message: `${rule.workflow} ${since}; it owes one every ${rule.within}h.` });
    }
  } else {
    const due = pastDue(opened([rule.slot], now), now)[0] ?? null;
    if (due !== null && (last === null || last < due.start)) {
      found.push({ source, message: `${rule.workflow} owed a success between ${utc(due.start)} and ${utc(due.due)}, and ${since}.` });
    }
  }
  return found;
}

/** How far back a missed Mac slot is still told, beyond the latest one: a watchdog run GitHub drops or delays loses none. */
const MAC_LOOK_BACK = 24 * MS_PER_HOUR;
/** watchdog.yml's cron spacing, so the runs before this one stood at `now` less a multiple of it. */
const WATCHDOG_SPACING = 2 * MS_PER_HOUR;

/** Slots past their deadline at `at` with no report, latest deadline first; each takes the latest report since it opened. */
function unreported(slots: readonly Opened[], reports: readonly number[], at: number): Opened[] {
  const times = reports.filter((time) => time <= at);
  const missed: Opened[] = [];
  for (const one of pastDue(slots, at)) {
    const taken = times.findIndex((time) => time >= one.start);
    if (taken >= 0) times.splice(taken, 1);
    else missed.push(one);
  }
  return missed;
}

function macFindings(rule: MacRule, reports: readonly Run[], now: number): Finding[] {
  const name = new RegExp(`^alert ${rule.source} (ok|fail)$`);
  const times = reports.filter((run) => name.test(run.displayTitle) && Date.parse(run.createdAt) <= now).map((run) => Date.parse(run.createdAt)).sort((a, b) => b - a);
  const week = opened(rule.slots, now);
  const latest = pastDue(week, now)[0];
  // A miss an earlier watchdog run saw was told then, and any report since closed its issue: telling it again opens another.
  const runsBefore = Array.from({ length: MAC_LOOK_BACK / WATCHDOG_SPACING }, (_, k) => now - (k + 1) * WATCHDOG_SPACING);
  const told = new Set(runsBefore.filter((at) => (times[0] ?? -Infinity) > at).flatMap((at) => unreported(week, times, at).map((one) => one.start)));
  const missed = unreported(week, times, now)
    .filter((one) => one.start === latest?.start || (one.due > now - MAC_LOOK_BACK && !told.has(one.start)))
    .reverse();
  if (missed.length === 0) return [];
  const slots = missed.map((one) => `${one.slot.start} ${one.slot.zone} slot (${utc(one.start)}) by ${one.slot.due}`).join(" and its ");
  return [{ source: rule.source, message: `The Mac's ${rule.source} job sent no report for its ${slots}. Asleep, offline, or launchd unloaded?` }];
}

/** Every finding at `now`. A workflow missing from `listed` was not listed, which the caller reports itself. */
export function findings(
  workflows: readonly WorkflowRule[],
  mac: readonly MacRule[],
  listed: ReadonlyMap<string, readonly Run[]>,
  now: number,
): Finding[] {
  const reports = listed.get("alert.yml");
  return [
    ...workflows.flatMap((rule) => {
      const runs = listed.get(rule.workflow);
      return runs === undefined ? [] : workflowFindings(rule, runs, now);
    }),
    ...(reports === undefined ? [] : mac.flatMap((rule) => macFindings(rule, reports, now))),
  ];
}
