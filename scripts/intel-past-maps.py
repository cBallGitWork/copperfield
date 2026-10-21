"""Past seasons' Premier League touches and shots, by FPL code, off the sister repo's SofaScore pages. Run once by hand.

    python3 -I scripts/intel-past-maps.py <sister> data/intel/past-maps

The player match log names each appearance's SofaScore match and player and its identity root; the root carries the
season-stable FPL code. Touches are counted on the app's own heat grid (`players/analysis/heat.ts`), so nothing is lost.
Only this season's pool (`data/intel/squads/26-27.json`) is kept.
"""

import glob
import json
import os
import re
import sys

import pandas as pd

SEASONS = ["21-22", "22-23", "23-24", "24-25", "25-26"]
# heat.ts's COLS and ROWS: a different grid would redraw every past map coarser or finer than this season's.
COLS, ROWS = 24, 16
OUTCOMES = ["goal", "save", "miss", "block", "post"]


def roots(sister: str) -> dict[str, dict]:
    found = {}
    for path in glob.glob(f"{sister}/data/identity/persons/root/*.json"):
        root = json.load(open(path))
        found[root["root_id"]] = root.get("source_mappings") or {}
    return found


def code_of(mapping: dict) -> int | None:
    code = mapping.get("fpl_code")
    return int(code) if code not in (None, "") else None


def folders(sister: str, season: str) -> dict[str, str]:
    """SofaScore match id -> the folder holding its pages; the id ends every folder's name."""
    found = {}
    for path in glob.glob(f"{sister}/data/raw/sofascore/20{season}/premier-league/*_*"):
        match = re.search(r"_(\d+)$", path)
        if match:
            found[match.group(1)] = path
    return found


def touches(sister: str, season: str, by_root: dict[str, dict], pool: set[int]) -> tuple[dict, dict]:
    log = pd.read_parquet(
        f"{sister}/data/match_logs/player_match_log/season={season}/player_match_log.parquet",
        columns=["competition", "sofascore_match_id", "provider_player_ids", "person_root_id"],
    )
    log = log[log["competition"] == "premier_league"]
    pages = folders(sister, season)
    grids: dict[int, dict[int, int]] = {}
    matches: dict[int, int] = {}
    seen: set[tuple[str, str]] = set()
    counts = {"rows": len(log), "unbridged": 0, "no page": 0, "drawn": 0}
    for row in log.itertuples(index=False):
        code = code_of(by_root.get(row.person_root_id) or {})
        if code is None:
            counts["unbridged"] += 1
            continue
        if code not in pool or pd.isna(row.sofascore_match_id):
            continue
        match = str(row.sofascore_match_id).split(".")[0]
        player = json.loads(row.provider_player_ids or "{}").get("sofascore")
        # A man can appear twice in a match's rows; counting him twice doubles his heat.
        if not player or (match, str(player)) in seen:
            continue
        seen.add((match, str(player)))
        path = f"{pages.get(match, '')}/player/{player}-heatmap.json"
        if match not in pages or not os.path.exists(path):
            counts["no page"] += 1
            continue
        points = (json.load(open(path)) or {}).get("heatmap") or []
        if not points:
            continue
        grid = grids.setdefault(code, {})
        for point in points:
            col = min(COLS - 1, int(point["x"] / 100 * COLS))
            row_ = min(ROWS - 1, int(point["y"] / 100 * ROWS))
            grid[row_ * COLS + col] = grid.get(row_ * COLS + col, 0) + 1
        matches[code] = matches.get(code, 0) + 1
        counts["drawn"] += 1
    players = {
        str(code): {"matches": matches[code], "cells": [v for cell in sorted(grid.items()) for v in cell]}
        for code, grid in sorted(grids.items())
    }
    return players, counts


def shots(sister: str, season: str, by_sofa: dict[str, int], pool: set[int]) -> tuple[dict, dict]:
    frame = pd.read_parquet(f"{sister}/data/staging/sofascore/shots.parquet")
    frame = frame[(frame["season"] == f"20{season}") & (frame["competition"] == "premier-league")]
    players: dict[str, list] = {}
    counts = {"rows": len(frame), "unbridged": 0, "refused": 0}
    for shot in frame.itertuples(index=False):
        code = by_sofa.get(str(int(shot.player_id))) if pd.notna(shot.player_id) else None
        if code is None:
            counts["unbridged"] += 1
            continue
        if code not in pool:
            continue
        outcome = "block" if shot.outcome == "blocked-off-line" else shot.outcome
        if outcome not in OUTCOMES or pd.isna(shot.x) or pd.isna(shot.y):
            counts["refused"] += 1
            continue
        # SofaScore measures a shot from the goal he attacks; a touch runs from his own goal, which the app draws.
        xg = None if pd.isna(shot.xg) else round(float(shot.xg), 3)
        players.setdefault(str(code), []).append([round(100 - float(shot.x), 1), round(float(shot.y), 1), xg, outcome])
    return players, counts


def main() -> None:
    sister, out = sys.argv[1], sys.argv[2]
    by_root = roots(sister)
    by_sofa = {str(m["sofascore"]): code_of(m) for m in by_root.values() if m.get("sofascore") and code_of(m)}
    pool = {p["code"] for p in json.load(open("data/intel/squads/26-27.json"))["players"]}
    os.makedirs(out, exist_ok=True)
    for season in SEASONS:
        touched, touch_counts = touches(sister, season, by_root, pool)
        shot, shot_counts = shots(sister, season, by_sofa, pool)
        payload = {
            "manifest": {"season": season, "grid": {"cols": COLS, "rows": ROWS}, "touches": touch_counts, "shots": shot_counts},
            "touches": touched,
            "shots": shot,
        }
        path = os.path.join(out, f"{season}.json")
        with open(path, "w") as handle:
            json.dump(payload, handle, separators=(",", ":"))
            handle.write("\n")
        print(f"{season}: {len(touched)} touch maps, {sum(map(len, shot.values()))} shots, {os.path.getsize(path) // 1024} KB  {touch_counts} {shot_counts}")


if __name__ == "__main__":
    main()
