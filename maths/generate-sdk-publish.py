"""
Sea Raider — Stake Engine math publisher.

Builds fun, frequent-win distributions that:
  • target 96.7% RTP
  • improve the base hit-rate while keeping the standard 25,000x cap
  • pass Stake risk checks (CVaR / tail liability)
  • emit index.json + CSV lookup + jsonl.zst books
"""

from __future__ import annotations

import json
import math
import random
from pathlib import Path

import zstandard as zstd

ROOT = Path(__file__).parent
PUBLISH_ROOT = ROOT / "publish_files"
TOTAL_WEIGHT = 1_000_000_000_000  # 1e12 — matches Stake SDK convention
TARGET_RTP = 0.967
RNG = random.Random(42)
FRAME_RNG = random.Random(20261106)
WILD_SURGE_WILDS_PER_LINE = {"curse": 5, "ghost": 20, "legend": 45, "ethereal": 30}
WILD_SURGE_MAX_LINES = 3
BONUS_PAYOUT_SCALE = 1.0
BONUS_START_MIN_BY_SCATTERS = {3: 1, 4: 10, 5: 20, 6: 50}
BONUS_MULTIPLIER_MAX = 50_000

# payoutMultiplier uses hundredths of base bet: 100 == 1.00x
SYMBOLS = ["H1", "H2", "H3", "H4", "L1", "L2", "L3", "L4", "L5", "WILD", "SCATTER"]
LOWS = ["L1", "L2", "L3", "L4", "L5"]
HIGHS = ["H1", "H2", "H3", "H4"]
PAYTABLE = {
    # Multiples of 4 keep each 20-line payout representable in SDK 0.1x steps
    # for every supported mode cost (1x, 1.5x, 5x, 10x, 25x, 250x, 500x).
    "H1": {3: 4.0, 4: 12.0, 5: 36.0}, "H2": {3: 4.0, 4: 8.0, 5: 28.0},
    "H3": {3: 4.0, 4: 8.0, 5: 20.0}, "H4": {3: 4.0, 4: 8.0, 5: 16.0},
    "L1": {3: 4.0, 4: 8.0, 5: 12.0}, "L2": {3: 4.0, 4: 8.0, 5: 12.0},
    "L3": {3: 4.0, 4: 4.0, 5: 8.0}, "L4": {3: 4.0, 4: 4.0, 5: 8.0},
    "L5": {3: 4.0, 4: 4.0, 5: 8.0}, "WILD": {3: 4.0, 4: 12.0, 5: 48.0},
}
PAYLINES = [
    [(0,0),(1,0),(2,0),(3,0),(4,0)], [(0,1),(1,1),(2,1),(3,1),(4,1)], [(0,2),(1,2),(2,2),(3,2),(4,2)],
    [(0,0),(1,1),(2,2),(3,1),(4,0)], [(0,2),(1,1),(2,0),(3,1),(4,2)],
    [(0,0),(1,0),(2,1),(3,2),(4,2)], [(0,2),(1,2),(2,1),(3,0),(4,0)],
    [(0,1),(1,2),(2,2),(3,2),(4,1)], [(0,1),(1,0),(2,0),(3,0),(4,1)],
    [(0,1),(1,0),(2,1),(3,2),(4,1)], [(0,1),(1,2),(2,1),(3,0),(4,1)],
    [(0,0),(1,1),(2,0),(3,1),(4,0)], [(0,2),(1,1),(2,2),(3,1),(4,2)],
    [(0,1),(1,1),(2,0),(3,1),(4,1)], [(0,1),(1,1),(2,2),(3,1),(4,1)],
    [(0,0),(1,2),(2,0),(3,2),(4,0)], [(0,2),(1,0),(2,2),(3,0),(4,2)],
    [(0,0),(1,1),(2,1),(3,1),(4,0)], [(0,2),(1,1),(2,1),(3,1),(4,2)],
    [(0,0),(1,2),(2,1),(3,0),(4,2)],
]

MODES = [
    # name, cost, max_win_x, hit_rate_target
    ("base", 1.0, 25_000, 0.55),
    ("bonus_chance", 5.0, 25_000, 0.72),
    ("super_bonus", 7.0, 25_000, 0.70),
    ("pirates_chance", 25.0, 25_000, 0.55),
    ("feature_spin", 10.0, 25_000, 0.70),
    # Every purchase awards a feature; the rare 50k row is the 6-scatter Ethereal.
    ("unknown_bonus", 250.0, 50_000, 1.00),
    ("unknown_extreme", 500.0, 50_000, 0.45),
]


def x_to_payout(x: float) -> int:
    """Convert to SDK payoutMultiplier units (0.1x steps; 100 == 1.0x)."""
    return max(0, int(round(x * 10)) * 10)


def payout_to_x(payout: int) -> float:
    return payout / 100.0


def make_empty_board(rng: random.Random = RNG) -> list[list[str]]:
    return [[rng.choice(LOWS) for _ in range(3)] for _ in range(5)]


def force_line_win(board: list[list[str]], symbol: str, count: int = 3) -> None:
    """Paint a middle-row left-to-right line win."""
    for col in range(count):
        board[col][1] = symbol
    for col in range(count, 5):
        if board[col][1] == symbol:
            board[col][1] = RNG.choice([s for s in LOWS if s != symbol])


def force_scatters(board: list[list[str]], count: int) -> None:
    cols = list(range(5))
    RNG.shuffle(cols)
    for i, col in enumerate(cols[: min(count, 5)]):
        board[col][i % 3] = "SCATTER"
    if count >= 6:
        board[cols[0]][(board[cols[0]].index("SCATTER") + 1) % 3] = "SCATTER"


def line_total(board: list[list[str]], cost: float, multiplier: float = 1.0) -> float:
    """Match the front-end's left-to-right, highest symbol win per payline math."""
    total = 0.0
    for line in PAYLINES:
        col, row = line[0]
        match_symbol = board[col][row]
        if match_symbol == "SCATTER":
            continue
        count = 1
        for col, row in line[1:]:
            symbol = board[col][row]
            if symbol == "SCATTER":
                break
            if match_symbol == "WILD":
                if symbol != "WILD":
                    match_symbol = symbol
                count += 1
            elif symbol == match_symbol or symbol == "WILD":
                count += 1
            else:
                break
        total += PAYTABLE.get(match_symbol, {}).get(count, 0.0) * (cost / len(PAYLINES))
    return total * multiplier


def calibrate_bonus_frame_multipliers(event: dict, booked_payout_x: float) -> float:
    """Fit a non-decreasing sequence using the published multiplier ladder."""
    frames = event.get("bonusSpinFrames") or []
    surge = event.get("wildSurge")
    included_frames = list(frames)
    if surge and surge.get("linesAwarded", 0) > 0:
        included_frames.append(surge["frame"])
    if not included_frames:
        raise ValueError("bonus outcome is missing its saved payout frames")

    coefficients = [line_total(frame["board"], 1.0, 1.0) for frame in included_frames]
    if not any(value > 0 for value in coefficients):
        raise ValueError("bonus outcome has no winning paylines to carry its booked payout")
    units_per_line = []
    for coefficient in coefficients:
        units = round(coefficient / 0.2)
        if not math.isclose(coefficient, units * 0.2, rel_tol=0, abs_tol=1e-8):
            raise ValueError(f"bonus line coefficient {coefficient:.10f} is not in 0.2x units")
        units_per_line.append(units)

    active_indices = [index for index, units in enumerate(units_per_line) if units > 0]
    base_multipliers = [int(frame["multiplier"]) for frame in included_frames]
    raw_units = sum(units_per_line[index] * base_multipliers[index] for index in active_indices)
    if raw_units <= 0:
        raise ValueError("bonus outcome has no positive line payout before multiplier calibration")

    min_units = sum(units_per_line[index] for index in active_indices)
    wanted_units = max(int(math.floor(booked_payout_x / 0.2 + 1e-8)), min_units)

    def scaled_sequence(scale: float) -> tuple[list[int], int]:
        values = [max(1, int(math.floor(value * scale + 0.5))) for value in base_multipliers]
        return values, sum(units_per_line[i] * values[i] for i in active_indices)

    low, high = 0.0, max(1.0, wanted_units / raw_units)
    while scaled_sequence(high)[1] < wanted_units:
        high *= 2
    for _ in range(80):
        middle = (low + high) / 2
        if scaled_sequence(middle)[1] < wanted_units:
            low = middle
        else:
            high = middle

    candidates = [scaled_sequence(low), scaled_sequence(high)]

    def add_monotone_suffix_steps(values: list[int], gap: int) -> list[int] | None:
        """Raise only suffixes: this preserves a non-decreasing sequence."""
        if gap == 0:
            return values
        suffix_coins = []
        for start in active_indices:
            coin = sum(units_per_line[i] for i in active_indices if i >= start)
            if coin > 0:
                suffix_coins.append((coin, start))
        reachable = [False] * (gap + 1)
        previous: list[tuple[int, int] | None] = [None] * (gap + 1)
        reachable[0] = True
        for amount in range(1, gap + 1):
            for coin, start in suffix_coins:
                if amount >= coin and reachable[amount - coin]:
                    reachable[amount] = True
                    previous[amount] = (amount - coin, start)
                    break
        if not reachable[gap]:
            return None
        adjusted = list(values)
        remainder = gap
        while remainder:
            item = previous[remainder]
            if item is None:
                return None
            remainder, start = item
            for index in range(start, len(adjusted)):
                adjusted[index] += 1
        return adjusted

    cap = 50_000 if event["scatterCount"] == 6 else 25_000
    floor = 5_000 if event["scatterCount"] == 6 else 1_500 if event["scatterCount"] == 5 else 0.1
    min_allowed = int(math.ceil(floor / 0.2 - 1e-8))
    max_allowed = int(math.floor(cap / 0.2 + 1e-8))
    chosen: tuple[list[int], int] | None = None
    for values, total in candidates:
        if total > wanted_units:
            continue
        if total < min_allowed:
            raised = add_monotone_suffix_steps(values, min_allowed - total)
            if raised is None:
                continue
            values = raised
            total = min_allowed
        if total <= max_allowed and (chosen is None or total > chosen[1]):
            chosen = (values, total)

    exact_jackpot_values = [cap]
    is_jackpot_row = any(
        math.isclose(booked_payout_x, value, rel_tol=0, abs_tol=0.051)
        for value in exact_jackpot_values
    )
    if chosen is None:
        # A tier's minimum start can make its booked target too small for the
        # previous scaling fit. Keep the generated feature progression and let
        # its actual paylines set the authoritative round payout below.
        values = list(base_multipliers)
        chosen = (values, sum(units_per_line[i] * values[i] for i in active_indices))

    def selectable(value: int) -> int:
        value = min(cap, max(1, value))
        if value <= 10:
            return value
        # The wheel uses ten-point stops after 10x: 20x, 30x, 40x, …
        return min(cap, max(20, int(math.floor((value + 5) / 10) * 10)))

    minimum_start = (
        3 if event.get("mode") == "super_bonus" and event["scatterCount"] == 4
        else BONUS_START_MIN_BY_SCATTERS.get(event["scatterCount"], 1)
    )

    def ladder_options(value: int, radius: int) -> list[int]:
        if value <= 10:
            return [value]
        lower = max(20, (value // 10) * 10)
        upper = max(20, ((value + 9) // 10) * 10)
        options = {lower, upper}
        for offset in range(1, radius + 1):
            options.add(max(20, lower - offset * 10))
            options.add(upper + offset * 10)
        return sorted(option for option in options if option <= cap)

    if is_jackpot_row:
        # Keep the feature cap exact while restricting every stop to the
        # selectable multiplier ladder. Intermediate tiers settle naturally.
        target_units = int(round(booked_payout_x / 0.2))
        multipliers = None
        for radius in range(5):
            states: dict[tuple[int, int], list[int]] = {(minimum_start, 0): []}
            for index, value in enumerate(chosen[0]):
                options = ladder_options(value, radius)
                if index == 0:
                    options = [option for option in options if option >= minimum_start]
                next_states: dict[tuple[int, int], list[int]] = {}
                coefficient = units_per_line[index]
                for (last, total), sequence in states.items():
                    for rung in options:
                        if rung < last:
                            continue
                        new_total = total + coefficient * rung
                        if new_total <= target_units:
                            next_states.setdefault((rung, new_total), sequence + [rung])
                states = next_states
                if not states:
                    break
            multipliers = next(
                (sequence for (_, total), sequence in states.items() if total == target_units),
                None,
            )
            if multipliers is not None:
                break
        if multipliers is None:
            raise ValueError(f"could not reach the {booked_payout_x:.1f}x jackpot with selectable multiplier stops")
    else:
        previous = minimum_start
        multipliers = []
        for index, value in enumerate(chosen[0]):
            rung = selectable(value)
            if index == 0:
                rung = selectable(max(rung, minimum_start))
            rung = max(previous, rung)
            multipliers.append(rung)
            previous = rung

        # Quantizing onto the selectable stops can move a low feature result
        # below its guaranteed 5/6-scatter floor. Raise a monotone suffix by
        # the smallest available ladder step until its real paylines meet it.
        floor_units = int(math.ceil(floor / 0.2 - 1e-8))
        current_units = sum(units_per_line[i] * multipliers[i] for i in active_indices)

        def next_stop(value: int) -> int:
            if value < 10:
                return value + 1
            if value == 10:
                return 20
            return min(cap, value + 10)

        while current_units < floor_units:
            best: tuple[int, list[int], int] | None = None
            for start in active_indices:
                adjusted = list(multipliers)
                previous_stop = adjusted[start - 1] if start else minimum_start
                for index in range(start, len(adjusted)):
                    adjusted[index] = max(next_stop(adjusted[index]), previous_stop)
                    previous_stop = adjusted[index]
                new_units = sum(units_per_line[i] * adjusted[i] for i in active_indices)
                if new_units > max_allowed or new_units <= current_units:
                    continue
                candidate = (new_units - current_units, adjusted, new_units)
                if best is None or candidate[0] < best[0]:
                    best = candidate
            if best is None:
                raise ValueError(f"could not meet the {floor}x bonus floor with selectable stops")
            _, multipliers, current_units = best
    total_units = sum(units_per_line[i] * multipliers[i] for i in active_indices)

    for index, frame in enumerate(included_frames):
        frame.pop("featureAwardX", None)
        frame["multiplier"] = multipliers[index]
    if any(
        included_frames[index]["multiplier"] > included_frames[index + 1]["multiplier"]
        for index in range(len(included_frames) - 1)
    ):
        raise ValueError("bonus multiplier sequence must only rise or hold steady")
    event.pop("featureAwardX", None)
    return total_units * 0.2


def nonwinning_board(mode: str, cost: float, multiplier: float) -> list[list[str]]:
    """Find a dead grid; feature-spin outcomes still contain their guaranteed Wild."""
    for _ in range(2_000):
        board = make_empty_board()
        if mode == "feature_spin":
            board[2][1] = "WILD"
        if line_total(board, cost, multiplier) == 0:
            return board
    raise ValueError(f"{mode}: could not construct a non-winning board")


def board_for_outcome(mode: str, payout_x: float, max_win: int, bonus_tier: str | None = None) -> dict:
    """Build a display board + metadata that fits the payout bucket."""
    board = make_empty_board()
    scatter_count = 0
    bonus_triggered = False
    bonus_type = None
    spins = 0
    wild_mult = 1
    mystery = None
    result = "no_win"

    if mode == "unknown_bonus":
        # Six scatters unlock the 50,000x Ethereal cap; five-scatter outcomes
        # settle naturally at up to 24,988x on the published paylines.
        result = "max_hunt" if payout_x >= 50_000 else "bonus_win"
        if bonus_tier == "ethereal" or (bonus_tier is None and payout_x >= 50_000):
            scatter_count, bonus_type, spins, wild_mult = 6, "ethereal", 10, 10
            mystery = "ETHEREAL CATACLYSM! 6 SCATTERS!"
        else:
            scatter_count = {"curse": 3, "ghost": 4, "legend": 5}.get(
                bonus_tier, 5 if payout_x >= 5_000 else 4 if payout_x >= 1_000 else 3
            )
            bonus_type = "legend" if scatter_count == 5 else "ghost" if scatter_count == 4 else "curse"
            spins = 15 if scatter_count == 5 else 12 if scatter_count == 4 else 10
            wild_mult = 5 if scatter_count == 5 else 3 if scatter_count == 4 else 2
            mystery = f"{scatter_count} SCATTERS! BONUS FEATURE AWARDED"
        force_scatters(board, scatter_count)
        bonus_triggered = True
    elif mode == "unknown_extreme" and bonus_tier:
        if bonus_tier == "ethereal":
            scatter_count, bonus_type, spins, wild_mult = 6, "ethereal", 10, 10
            mystery = "ETHEREAL CATACLYSM! 6 SCATTERS!"
            result = "max_hunt" if payout_x >= max_win else "bonus_win"
        elif bonus_tier == "hidden":
            scatter_count, bonus_type, spins, wild_mult = 5, "legend", 15, 5
            mystery = "HIDDEN BONUS UNLOCKED! 5 SCATTERS!"
            result = "bonus_win"
        else:
            # Keep premium-buy non-bonus outcomes visibly below the trigger.
            scatter_count = 0
            result = "no_win" if payout_x <= 0 else "line_win"
        if scatter_count:
            force_scatters(board, scatter_count)
            bonus_triggered = True
    elif mode == "unknown_extreme" and bonus_tier == "none":
        result = "no_win" if payout_x <= 0 else "line_win"
        if payout_x > 0:
            force_line_win(board, RNG.choice(HIGHS + LOWS), 3)
    elif mode in ("base", "bonus_chance", "super_bonus", "pirates_chance") and bonus_tier is not None:
        scatter_by_tier = {"curse": 3, "ghost": 4, "legend": 5}
        if bonus_tier in scatter_by_tier:
            scatter_count = scatter_by_tier[bonus_tier]
            force_scatters(board, scatter_count)
            bonus_triggered = True
            bonus_type = bonus_tier
            spins = {3: 10, 4: 12, 5: 15}[scatter_count]
            wild_mult = {3: 2, 4: 3, 5: 5}[scatter_count]
            result = "bonus_win"
            mystery = f"{scatter_count} SCATTERS! BONUS FEATURE AWARDED"
        else:
            # Non-feature outcomes retain their booked win without accidental scatters.
            result = "no_win" if payout_x <= 0 else "line_win"
    elif payout_x <= 0:
        result = "no_win"
        # Keep dead boards mostly clean of scatters/wilds
        for c in range(5):
            for r in range(3):
                if board[c][r] in ("SCATTER", "WILD"):
                    board[c][r] = RNG.choice(LOWS)
    elif payout_x < 1:
        result = "small_win"
        force_line_win(board, RNG.choice(LOWS), 3)
    elif payout_x < 5:
        result = "line_win"
        force_line_win(board, RNG.choice(HIGHS + LOWS), 3)
        if RNG.random() < 0.25:
            board[2][RNG.randrange(3)] = "WILD"
            wild_mult = 2
    elif payout_x < 20:
        result = "nice_win"
        force_line_win(board, RNG.choice(HIGHS), 4)
        board[2][1] = "WILD"
        wild_mult = 2
    elif payout_x < 40:
        result = "solid_win"
        force_line_win(board, RNG.choice(HIGHS[:2]), 5)
        board[2][1] = "WILD"
        wild_mult = 3
    elif payout_x < max_win * 0.2:
        # Feature / bonus territory
        result = "bonus_win"
        if mode == "feature_spin":
            board[2][1] = "WILD"
            force_line_win(board, "H1", 4)
            wild_mult = 5
        elif mode.startswith("unknown"):
            scatter_count = 5 if payout_x >= 200 else 3
            force_scatters(board, scatter_count)
            bonus_triggered = True
            bonus_type = "legend" if scatter_count >= 5 else "curse"
            spins = 15 if scatter_count >= 5 else 10
            wild_mult = 5 if scatter_count >= 5 else 2
            mystery = f"{scatter_count} SCATTERS LANDED!"
        else:
            scatter_count = 3
            force_scatters(board, 3)
            bonus_triggered = True
            bonus_type = "curse"
            spins = 10
            wild_mult = 2
    else:
        result = "max_hunt"
        scatter_count = 6 if max_win >= 50_000 and payout_x >= max_win * 0.5 else 5
        force_scatters(board, scatter_count)
        bonus_triggered = True
        bonus_type = "ethereal" if scatter_count >= 6 else "legend"
        spins = 10 if scatter_count >= 6 else 15
        wild_mult = 10 if scatter_count >= 6 else 5
        mystery = f"{'ETHEREAL CATACLYSM' if scatter_count >= 6 else 'PIRATE LEGEND'}!"

    # Feature Spin always shows at least one Wild. Choose an unoccupied cell so
    # a booked Scatter and its already-decided trigger count are never changed.
    if mode == "feature_spin" and not any("WILD" in col for col in board):
        for col_idx in (2, 1, 3, 0, 4):
            row_idx = next((r for r, symbol in enumerate(board[col_idx]) if symbol != "SCATTER"), None)
            if row_idx is not None:
                board[col_idx][row_idx] = "WILD"
                break

    return {
        "type": "reveal",
        "mode": mode,
        "result": result,
        "board": board,
        "scatterCount": scatter_count,
        "bonusTriggered": bonus_triggered,
        "bonusType": bonus_type,
        "bonusSpinsAwarded": spins,
        "wildMultiplier": wild_mult,
        "mysteryOutcomeText": mystery,
        "payoutX": round(payout_x, 4),
    }


def make_bonus_spin_frames(bonus_type: str, initial_spins: int) -> list[dict]:
    """Precalculate the visible bonus sequence so live play and replay agree.

    Round payout remains the authoritative book payout. These snapshots carry
    only the boards, multipliers and retriggers needed to render the feature.
    """
    current_multiplier = 10 if bonus_type == "ethereal" else 2
    total_spins = initial_spins
    frames: list[dict] = []
    while len(frames) < total_spins:
        if total_spins > 200:
            raise ValueError(f"{bonus_type}: retriggers produced an unsafe bonus length")
        board = make_empty_board(FRAME_RNG)

        # Set the feature's visible Wild pattern before placing retrigger Scatters.
        if bonus_type == "ghost":
            board[1][1] = "WILD"
            if FRAME_RNG.random() < 0.5:
                board[3][FRAME_RNG.randrange(3)] = "WILD"
            current_multiplier = min(current_multiplier + 1, 20)
        elif bonus_type == "legend":
            for col in (1, 2, 3):
                board[col][FRAME_RNG.randrange(3)] = "WILD"
            current_multiplier = min(current_multiplier + 2, 50)
        elif bonus_type == "ethereal":
            for col in range(5):
                if FRAME_RNG.random() < 0.6:
                    row = next((row for row in range(3) if board[col][row] != "WILD"), None)
                    if row is not None:
                        board[col][row] = "WILD"
            current_multiplier = min(current_multiplier + 5, 100)
        else:
            # Curse of the High Seas: a steady 2x → 5x climb, then hold.
            current_multiplier = min(2 + len(frames), 5)
            if FRAME_RNG.random() < 0.4:
                col = FRAME_RNG.randrange(5)
                row = FRAME_RNG.randrange(3)
                board[col][row] = "WILD"

        # Keep retriggers part of the precomputed feature. Scatters occupy only
        # non-Wild cells, preserving the feature's guaranteed Wild placement.
        retrigger_spins = 0
        retrigger_roll = FRAME_RNG.random()
        # Fewer retriggers keep the bonus moving toward its new Wild Surge finale.
        scatter_target = 3 if retrigger_roll < 0.02 else 2 if retrigger_roll < 0.10 else 0
        if scatter_target:
            available = [(col, row) for col in range(5) for row in (1, 2) if board[col][row] != "WILD"]
            FRAME_RNG.shuffle(available)
            for col, row in available[:scatter_target]:
                board[col][row] = "SCATTER"
            retrigger_spins = 5 if scatter_target >= 3 else 3
            total_spins += retrigger_spins

        # Guarantee a visible paying connection in each frame, as the live
        # bonus UI expects to animate line hits while the booked total counts up.
        if line_total(board, 1.0, current_multiplier) <= 0:
            for line in PAYLINES:
                points = line[:3]
                if any(board[col][row] == "SCATTER" for col, row in points):
                    continue
                for col, row in points:
                    if board[col][row] != "WILD":
                        board[col][row] = "H1"
                if line_total(board, 1.0, current_multiplier) > 0:
                    break

        frames.append({
            "board": board,
            "multiplier": current_multiplier,
            "retriggerSpins": retrigger_spins,
        })

    return frames


def make_wild_surge(bonus_type: str, frames: list[dict]) -> dict:
    """Precompute a bonus-end Wild board from Wilds revealed during free spins."""
    wild_count = sum(
        symbol == "WILD"
        for frame in frames
        for reel in frame["board"]
        for symbol in reel
    )
    wilds_per_line = WILD_SURGE_WILDS_PER_LINE[bonus_type]
    lines_awarded = min(WILD_SURGE_MAX_LINES, wild_count // wilds_per_line)
    board = make_empty_board(FRAME_RNG)
    surge_rows = list(range(3))
    FRAME_RNG.shuffle(surge_rows)
    for row in surge_rows[:lines_awarded]:
        for reel in range(5):
            board[reel][row] = "WILD"
    return {
        "wildCount": wild_count,
        "wildsPerLine": wilds_per_line,
        "linesAwarded": lines_awarded,
        "frame": {
            "board": board,
            "multiplier": frames[-1]["multiplier"] if frames else 1,
            "retriggerSpins": 0,
        },
    }


def allocate_weights(probs: list[float]) -> list[int]:
    """Convert probabilities to integer weights that sum exactly to TOTAL_WEIGHT."""
    raw = [p * TOTAL_WEIGHT for p in probs]
    weights = [int(math.floor(v)) for v in raw]
    # Put integer rounding drift into the largest bucket, never into a no-win
    # row when a mode is designed to have a guaranteed feature.
    drift = TOTAL_WEIGHT - sum(weights)
    weights[max(range(len(weights)), key=weights.__getitem__)] += drift
    if any(w < 0 for w in weights):
        raise ValueError("Negative weight after allocation")
    return weights


def build_curve(cost: float, max_win: int, hit_rate: float, mode_name: str) -> list[tuple[float, float]]:
    """
    Return [(payout_x, probability), ...] including the 0x bucket.
    Designed so:
      • hit rate ≈ hit_rate
      • RTP ≈ 0.965 * cost  (absolute base-bet multiples)
      • ≥10% of RTP comes from wins < 40×cost
      • average of top 0.1% outcomes ≤ 700×cost
    """
    target_return = TARGET_RTP * cost  # absolute x of base bet
    threshold_40 = 40.0 * cost

    # Win shape in *absolute* base-bet multiples, as fractions of hit mass.
    # Tuned for a lively mid-volatility pirate slot.
    if mode_name == "base":
        # Make the base game less punishing: frequent small/medium returns,
        # while leaving the shared payline table and jackpot ladder unchanged.
        shape = [
            (0.5, 0.10),
            (1.0, 0.30),
            (1.5, 0.30),
            (2.5, 0.20),
            (4.58, 0.10),
        ]
    elif cost <= 2:
        # base / bonus_chance — lots of small line wins
        shape = [
            (0.25, 0.22),
            (0.50, 0.16),
            (1.00, 0.14),
            (2.00, 0.12),
            (3.50, 0.08),
            (5.00, 0.06),
            (8.00, 0.05),
            (12.0, 0.04),
            (20.0, 0.03),
            (30.0, 0.025),
            (50.0, 0.02),
            (80.0, 0.015),
            (150.0, 0.012),
            (300.0, 0.008),
            (600.0, 0.005),
            (1200.0, 0.003),
            (2500.0, 0.0015),
            (5000.0, 0.0008),
            (10000.0, 0.0004),
            (min(max_win, 25000), 0.0003),
        ]
    elif cost <= 10:
        # super_bonus / feature_spin
        shape = [
            (cost * 0.3, 0.18),
            (cost * 0.6, 0.15),
            (cost * 1.0, 0.14),
            (cost * 1.5, 0.12),
            (cost * 2.5, 0.10),
            (cost * 4.0, 0.08),
            (cost * 6.0, 0.06),
            (cost * 10.0, 0.05),
            (cost * 15.0, 0.04),
            (cost * 25.0, 0.03),
            (cost * 40.0, 0.02),
            (cost * 70.0, 0.015),
            (cost * 120.0, 0.01),
            (cost * 250.0, 0.006),
            (cost * 500.0, 0.003),
            (min(max_win, cost * 2000), 0.001),
            (min(max_win, 25000), 0.0005),
        ]
    elif cost <= 50:
        # pirates_chance
        shape = [
            (cost * 0.4, 0.16),
            (cost * 0.8, 0.14),
            (cost * 1.2, 0.13),
            (cost * 2.0, 0.12),
            (cost * 3.0, 0.10),
            (cost * 5.0, 0.09),
            (cost * 8.0, 0.07),
            (cost * 12.0, 0.06),
            (cost * 20.0, 0.05),
            (cost * 35.0, 0.035),
            (cost * 60.0, 0.02),
            (cost * 100.0, 0.012),
            (cost * 200.0, 0.007),
            (min(max_win, cost * 500), 0.004),
            (min(max_win, 25000), 0.002),
        ]
    else:
        # unknown buys — mostly feature outcomes, still some dead / small
        shape = [
            (cost * 0.2, 0.10),
            (cost * 0.5, 0.12),
            (cost * 0.9, 0.14),
            (cost * 1.2, 0.16),
            (cost * 1.8, 0.14),
            (cost * 2.5, 0.10),
            (cost * 4.0, 0.08),
            (cost * 6.0, 0.06),
            (cost * 10.0, 0.04),
            (cost * 18.0, 0.025),
            (cost * 30.0, 0.015),
            (cost * 50.0, 0.01),
            (cost * 80.0, 0.006),
            (min(max_win, cost * 120), 0.003),
            (min(max_win, 50000), 0.001),
        ]

    # Normalize shape, apply hit_rate, clamp payouts
    shape = [(min(px, max_win), max(w, 0.0)) for px, w in shape if px > 0]
    shape_sum = sum(w for _, w in shape)
    shape = [(px, w / shape_sum) for px, w in shape]

    win_probs = [(px, share * hit_rate) for px, share in shape]
    # Scale win probs so expected return matches target RTP
    raw_return = sum(px * p for px, p in win_probs)
    if raw_return <= 0:
        raise ValueError("Invalid curve return")
    scale = target_return / raw_return
    # Scaling payouts keeps probabilities (hit rate) intact
    # SDK lookup tables require every non-zero payout to be at least 10
    # hundredths of a base bet (0.10x). Keep probability mass intact, then the
    # RTP nudge below funds the minimum from the largest compatible bucket.
    win_probs = [(max(0.1, min(px * scale, max_win)), p) for px, p in win_probs]

    # If scaling blew past max_win too often, trim and re-normalize return via hit mass
    actual_return = sum(px * p for px, p in win_probs)
    if actual_return < target_return * 0.98:
        # Boost mid buckets slightly by raising hit rate
        boost = target_return / actual_return
        new_hit = min(0.95, hit_rate * boost)
        ratio = new_hit / hit_rate
        win_probs = [(px, p * ratio) for px, p in win_probs]
        hit_rate = new_hit

    no_win_p = 1.0 - sum(p for _, p in win_probs)
    if no_win_p < 0.02 and cost != 250.0:
        # Extremely high hit modes (unknown_bonus) can sit near always-on features
        # Rebalance lightly toward no-win while preserving RTP via payout bump
        deficit = 0.05 - no_win_p
        win_probs = [(px, p * (1.0 - deficit / max(sum(p for _, p in win_probs), 1e-12))) for px, p in win_probs]
        no_win_p = 1.0 - sum(p for _, p in win_probs)

    curve = [(0.0, no_win_p)] + win_probs

    # Final RTP nudge on the largest non-zero bucket
    current = sum(px * p for px, p in curve)
    if abs(current - target_return) > 1e-6:
        # adjust top non-max bucket payout
        for i in range(len(curve) - 2, 0, -1):
            px, p = curve[i]
            if p <= 0:
                continue
            needed = target_return - (current - px * p)
            new_px = max(0.1, needed / p)
            if new_px <= max_win:
                curve[i] = (new_px, p)
                break

    return curve


def risk_report(curve: list[tuple[float, float]], cost: float) -> dict:
    """Approximate Stake risk metrics from the discrete curve."""
    rtp = sum(px * p for px, p in curve)
    mean = rtp
    second = sum((px**2) * p for px, p in curve)
    variance = max(0.0, second - mean**2)
    std = math.sqrt(variance)
    vol = std / cost  # relative to cost

    # RTP from ≥ 40× cost
    thr = 40.0 * cost
    rtp_40 = sum(px * p for px, p in curve if px >= thr)
    share_40 = rtp_40 / rtp if rtp > 0 else 0.0
    rtp_10k = sum(px * p for px, p in curve if px >= 10_000)
    share_10k = rtp_10k / rtp if rtp > 0 else 0.0

    # CVaR of worst (largest) 0.1% of rounds, relative to cost
    tail_mass = 0.001
    remaining = tail_mass
    ordered = sorted(curve, key=lambda t: t[0], reverse=True)
    cvar_sum = 0.0
    for px, p in ordered:
        if remaining <= 0:
            break
        take = min(p, remaining)
        cvar_sum += px * take
        remaining -= take
    cvar_abs = cvar_sum / tail_mass
    cvar_rel = cvar_abs / cost

    def hit_odds(threshold: float) -> float:
        p = sum(prob for px, prob in curve if px >= threshold)
        return (1.0 / p) if p > 0 else float("inf")

    hit = sum(p for px, p in curve if px > 0)
    # Stake big-win frequency caps (most-frequent allowed)
    odds_5k = hit_odds(5_000)
    odds_10k = hit_odds(10_000)
    odds_25k = hit_odds(25_000)
    odds_50k = hit_odds(50_000)
    return {
        "rtp": rtp / cost,
        "hit_rate": hit,
        "volatility": vol,
        "cvar_rel": cvar_rel,
        "rtp_from_40x_cost": share_40,
        "rtp_from_10k": share_10k,
        "odds_5k": odds_5k,
        "odds_10k": odds_10k,
        "odds_25k": odds_25k,
        "odds_50k": odds_50k,
        "pass_cvar": cvar_rel <= 700.0,
        "pass_tail": share_40 <= 0.90 and share_10k <= 0.80,
        "pass_vol": vol <= 60.0,
        # Limits are "1 in N" minimum spacing — rarer (higher N) always OK
        "pass_bigwin": (
            odds_5k >= 20
            and odds_10k >= 100
            and odds_25k >= 200
            and odds_50k >= 1_000
        ),
    }


def jackpot_ladder(name: str, max_win: int) -> list[tuple[float, float]]:
    """
    Real jackpot odds — exciting, but inside Stake big-win caps:
      5k ≥ 1/20, 10k ≥ 1/100, 25k ≥ 1/200, 50k ≥ 1/1000
    """
    if max_win >= 50_000:
        if name == "unknown_extreme":
            # Premium buy: max feels achievable
            return [
                (12_500, 1 / 900),
                (25_000, 1 / 2_500),
                (35_000, 1 / 4_500),
                (50_000, 1 / 7_500),
            ]
        # unknown_bonus
        return [
            (12_500, 1 / 2_500),
            (25_000, 1 / 4_000),
            (35_000, 1 / 8_000),
            (50_000, 1 / 5_000),
        ]
    # Standard 25,000x modes
    ladders = {
        "bonus_chance": [
            (5_000, 1 / 75_000),
            (10_000, 1 / 225_000),
            (25_000, 1 / 200_000),
        ],
        "base": [
            (5_000, 1 / 50_000),
            (10_000, 1 / 150_000),
            (25_000, 1 / 200_000),
        ],
        "super_bonus": [
            (5_000, 1 / 18_000),
            (10_000, 1 / 55_000),
            (25_000, 1 / 160_000),
        ],
        "pirates_chance": [
            (5_000, 1 / 10_000),
            (10_000, 1 / 35_000),
            (25_000, 1 / 90_000),
        ],
        "feature_spin": [
            (5_000, 1 / 12_000),
            (10_000, 1 / 40_000),
            (25_000, 1 / 110_000),
        ],
    }
    return ladders.get(
        name,
        [(5_000, 1 / 25_000), (10_000, 1 / 80_000), (25_000, 1 / 250_000)],
    )


def inject_jackpots(
    curve: list[tuple[float, float]],
    ladder: list[tuple[float, float]],
    cost: float,
    max_win: int,
) -> list[tuple[float, float]]:
    """
    Pin exact high-tier payouts with real odds.
    Fund them by trimming mid-tier win mass (keeps hit-rate feel, preserves RTP).
    """
    # Replace near-max placeholders with the minimum payable unit instead of
    # discarding their probability mass. The explicit ladder below owns the
    # published jackpot odds; dropping placeholder mass silently crushed hit rate.
    existing: dict[float, float] = {}
    for px, p in curve:
        mapped_px = px if px < max_win * 0.9 else 0.1
        existing[mapped_px] = existing.get(mapped_px, 0.0) + p

    add_p = sum(p for _, p in ladder)
    add_rtp = sum(px * p for px, p in ladder)

    # Steal probability from no-win first (keeps more winning feel), then small wins
    remaining_p = add_p
    remaining_rtp = add_rtp
    new_curve: list[tuple[float, float]] = []
    for px, p in sorted(existing.items()):
        if remaining_p <= 0:
            new_curve.append((px, p))
            continue
        if px == 0.0:
            take = min(p * 0.15, remaining_p)  # don't gut the dead-spin mass
            new_curve.append((px, p - take))
            remaining_p -= take
            continue
        # Trim mid wins (2x–200x cost) to fund jackpots
        if 2.0 * cost <= px <= 200.0 * cost and remaining_rtp > 0:
            take_rtp = min(px * p * 0.35, remaining_rtp)
            take_p = take_rtp / px if px > 0 else 0.0
            take_p = min(take_p, p * 0.35, remaining_p)
            new_curve.append((px, p - take_p))
            remaining_p -= take_p
            remaining_rtp -= take_p * px
        else:
            new_curve.append((px, p))

    # If still short on probability, pull more from no-win
    if remaining_p > 1e-15:
        for i, (px, p) in enumerate(new_curve):
            if px == 0.0 and p > remaining_p:
                new_curve[i] = (0.0, p - remaining_p)
                remaining_p = 0.0
                break

    jackpot_px = {float(px) for px, _ in ladder}
    for px, p in ladder:
        new_curve.append((float(px), p))

    # Renormalize tiny float drift on no-win
    total_p = sum(p for _, p in new_curve)
    if abs(total_p - 1.0) > 1e-12:
        for i, (px, p) in enumerate(new_curve):
            if px == 0.0:
                new_curve[i] = (0.0, max(0.0, p + (1.0 - total_p)))
                break

    # Force RTP back to target by scaling non-jackpot win payouts while
    # retaining the SDK's minimum non-zero amount of 0.10x.
    target = TARGET_RTP * cost
    jackpot_rtp = sum(px * p for px, p in new_curve if px in jackpot_px)
    other_rtp = sum(px * p for px, p in new_curve if px not in jackpot_px and px > 0)
    need_other = target - jackpot_rtp
    if other_rtp > 0 and need_other > 0:
        low, high = 0.0, max(1.0, need_other / other_rtp)
        def other_return(scale: float) -> float:
            return sum(
                (min(max_win, max(0.1, px * scale)) if px > 0 and px not in jackpot_px else px) * p
                for px, p in new_curve
            ) - jackpot_rtp
        while other_return(high) < need_other:
            high *= 2
        for _ in range(80):
            mid = (low + high) / 2
            if other_return(mid) < need_other:
                low = mid
            else:
                high = mid
        scale = (low + high) / 2
        new_curve = [
            (min(max_win, max(0.1, px * scale)), p)
            if (px > 0 and px not in jackpot_px) else (px, p)
            for px, p in new_curve
        ]
    elif need_other <= 0:
        # Jackpots alone exceed target — thin jackpot odds, restore dead-spin mass
        thin = target / max(jackpot_rtp, 1e-12)
        freed = 0.0
        adjusted = []
        for px, p in new_curve:
            if px in jackpot_px:
                adjusted.append((px, p * thin))
                freed += p * (1.0 - thin)
            else:
                adjusted.append((px, p))
        for i, (px, p) in enumerate(adjusted):
            if px == 0.0:
                adjusted[i] = (0.0, p + freed)
                break
        new_curve = adjusted

    return new_curve


def build_mode(name: str, cost: float, max_win: int, hit_rate: float) -> dict:
    # Each mode has its own deterministic stream so adding outcomes to one mode
    # cannot silently alter the subsequent modes' books.
    mode_seed = sum((index + 1) * ord(char) for index, char in enumerate(name)) + 42
    RNG.seed(mode_seed)
    curve = build_curve(cost, max_win, hit_rate, name)
    report = risk_report(curve, cost)

    # If risk fails, compress the far tail into mid wins
    guard = 0
    while (not report["pass_cvar"] or not report["pass_tail"]) and guard < 8:
        guard += 1
        thr = 40.0 * cost
        new_curve: list[tuple[float, float]] = []
        spilled_rtp = 0.0
        spilled_p = 0.0
        for px, p in curve:
            if px > max(thr * 2.5, 500.0 * cost / 25.0) and px < max_win:
                spilled_rtp += px * p
                spilled_p += p
            else:
                new_curve.append((px, p))
        # Reinject spilled mass as ~15×cost wins (under CVaR pressure, still exciting)
        inject_px = min(max_win * 0.05, 15.0 * cost)
        if spilled_p > 0:
            new_curve.append((inject_px, spilled_p))
            # Preserve RTP by bumping inject payout
            needed = spilled_rtp
            new_curve[-1] = (min(max_win, needed / spilled_p), spilled_p)
        curve = new_curve
        report = risk_report(curve, cost)

    # Real jackpot ladder (replaces the old 1-in-1e12 placeholder)
    curve = inject_jackpots(curve, jackpot_ladder(name, max_win), cost, max_win)
    report = risk_report(curve, cost)

    # If jackpots pushed CVaR/tail over, thin the very top odds slightly
    guard = 0
    while (
        not (
            report["pass_cvar"]
            and report["pass_tail"]
            and report["pass_bigwin"]
            and report["pass_vol"]
        )
        and guard < 6
    ):
        guard += 1
        thinned: list[tuple[float, float]] = []
        freed_p = 0.0
        freed_rtp = 0.0
        for px, p in curve:
            if px >= max_win * 0.7:
                thinned.append((px, p * 0.7))
                freed_p += p * 0.3
                freed_rtp += px * p * 0.3
            else:
                thinned.append((px, p))
        # Put freed mass into ~8×cost wins
        inject_px = min(max_win * 0.05, 8.0 * cost)
        thinned.append((inject_px, freed_p))
        # keep RTP: bump inject
        if freed_p > 0:
            thinned[-1] = (min(max_win * 0.2, freed_rtp / freed_p), freed_p)
        curve = thinned
        report = risk_report(curve, cost)

    probs = [p for _, p in curve]
    payouts_x = [px for px, _ in curve]
    weights = allocate_weights(probs)

    weighted_outcomes = [(float(px), weight, None) for px, weight in zip(payouts_x, weights)]
    if name in ("unknown_bonus", "unknown_extreme", "base", "bonus_chance", "super_bonus", "pirates_chance"):
        # Match the advertised outcome odds exactly in integer math weights.
        remaining = [[px, weight] for px, weight in zip(payouts_x, weights)]
        weighted_outcomes = []
        tier_plans = {
            "unknown_bonus": (("ethereal", 1_000_000_000), ("legend", 110_000_000_000),
                              ("ghost", 369_000_000_000), ("curse", 520_000_000_000)),
            "unknown_extreme": (("ethereal", 20_000_000_000), ("hidden", 130_000_000_000),
                                ("none", 850_000_000_000)),
            "base": (("legend", 28_666_666), ("curse", 1_823_513_790),
                     ("none", 998_147_819_544)),
            "bonus_chance": (("legend", 500_000_000), ("ghost", 3_500_000_000),
                             ("curse", 96_000_000_000), ("none", 900_000_000_000)),
            "super_bonus": (("legend", 2_750_000_000), ("ghost", 22_000_000_000),
                            ("curse", 30_250_000_000), ("none", 945_000_000_000)),
            "pirates_chance": (("legend", 7_500_000_000), ("ghost", 3_125_000_000),
                               ("curse", 1_875_000_000), ("none", 987_500_000_000)),
        }
        tiers = tier_plans[name]
        for tier, target in tiers:
            need = target
            if name == "unknown_bonus" and tier == "ethereal":
                # Reserve the five-scatter 25k booked tier for Legend.
                order = sorted(
                    (i for i in range(len(remaining)) if remaining[i][0] != 25_000.0),
                    key=lambda i: remaining[i][0],
                    reverse=True,
                )
            elif name == "bonus_chance" and tier in ("curse", "ghost"):
                # Bonus Chance trades some feature payout size for its higher
                # trigger rate, preserving room for frequent ordinary wins.
                target_band = (6.0 if tier == "curse" else 32.0) * cost
                order = sorted(range(len(remaining)), key=lambda i: abs(remaining[i][0] - target_band))
            elif name == "super_bonus" and tier in ("curse", "ghost"):
                # Keep Super Bonus's high trigger/scatter frequency inside its
                # RTP budget by favoring lower booked payouts for common tiers.
                target_band = (4.0 if tier == "curse" else 6.0) * cost
                order = sorted(range(len(remaining)), key=lambda i: abs(remaining[i][0] - target_band))
            elif name == "base" and tier in ("curse", "ghost"):
                # Keep the common 3-scatter feature in a satisfying mid-win
                # band instead of assigning every trigger to the extreme tail.
                target_band = (50.0 if tier == "curse" else 250.0) * cost
                order = sorted(range(len(remaining)), key=lambda i: abs(remaining[i][0] - target_band))
            else:
                order = sorted(range(len(remaining)), key=lambda i: remaining[i][0], reverse=True)
            for idx in order:
                px, available = remaining[idx]
                take = min(available, need)
                if take:
                    weighted_outcomes.append((px, take, tier))
                    remaining[idx][1] -= take
                    need -= take
                if need == 0:
                    break
            if need:
                raise ValueError(f"{name}: could not allocate {tier} weight")
        for px, weight in remaining:
            if weight:
                raise ValueError(f"{name}: unassigned weight {weight}")

        # Enforce guaranteed round totals and tier-specific caps, then rescale
        # the non-jackpot rows together so RTP stays inside the published target.
        floors = {"legend": 1_500.0, "hidden": 1_500.0, "ethereal": 5_000.0}
        caps = {"legend": 25_000.0, "hidden": 25_000.0, "ethereal": 50_000.0}
        jackpot_values = [px for px, _ in jackpot_ladder(name, max_win)]

        def scaled_outcomes(scale: float) -> list[list]:
            normalized = []
            for original_px, weight, tier in weighted_outcomes:
                is_jackpot = any(abs(original_px - value) < 1e-6 for value in jackpot_values)
                px = original_px if is_jackpot else original_px * scale
                px = min(max_win, px)
                if tier in floors:
                    px = min(caps[tier], max(floors[tier], px))
                normalized.append([px, weight, tier])
            return normalized

        target_return = TARGET_RTP * cost
        minimum_rows = scaled_outcomes(0)
        minimum_return = sum(px * weight for px, weight, _ in minimum_rows) / TOTAL_WEIGHT
        if minimum_return > target_return + 1e-9:
            raise ValueError(
                f"{name}: guaranteed scatter floors require at least {minimum_return:.4f}x return, "
                f"above its {target_return:.4f}x RTP budget"
            )

        low, high = 0.0, 1.0
        while sum(px * weight for px, weight, _ in scaled_outcomes(high)) / TOTAL_WEIGHT < target_return:
            high *= 2
            if high > 1_000_000:
                raise ValueError(f"{name}: could not scale outcomes to target RTP")
        for _ in range(80):
            mid = (low + high) / 2
            value = sum(px * weight for px, weight, _ in scaled_outcomes(mid)) / TOTAL_WEIGHT
            if value < target_return:
                low = mid
            else:
                high = mid
        normalized = scaled_outcomes((low + high) / 2)
        weighted_outcomes = [(float(px), weight, tier) for px, weight, tier in normalized]

    rows = []
    events = []
    for i, (px, weight, bonus_tier) in enumerate(weighted_outcomes):
        payout = x_to_payout(px)
        # Keep max-win exact
        if abs(px - max_win) < 1e-6 or (i == len(payouts_x) - 1 and px >= max_win * 0.99):
            payout = x_to_payout(max_win)
            px = float(max_win)
        meta = board_for_outcome(name, px, max_win, bonus_tier)
        if meta["bonusTriggered"] and meta["bonusType"] and meta["bonusSpinsAwarded"]:
            meta["bonusSpinFrames"] = make_bonus_spin_frames(
                meta["bonusType"], meta["bonusSpinsAwarded"]
            )
            meta["wildSurge"] = make_wild_surge(meta["bonusType"], meta["bonusSpinFrames"])
        if not meta["bonusTriggered"]:
            if payout > 0:
                if line_total(meta["board"], cost, meta["wildMultiplier"]) <= 0:
                    force_line_win(meta["board"], "L1", 3)
                payout = x_to_payout(line_total(meta["board"], cost, meta["wildMultiplier"]))
                if payout <= 0:
                    raise ValueError(f"{name}: paying outcome {i} rounds below the SDK minimum payout")
            else:
                meta["board"] = nonwinning_board(name, cost, meta["wildMultiplier"])
            meta["payoutX"] = round(payout / 100.0, 4)
        rows.append((i, weight, payout))
        events.append(
            {
                "id": i,
                "events": [meta],
                "payoutMultiplier": payout,
            }
        )

    # Restore the target RTP by adjusting precomputed feature round values.
    # The visible boards are calibrated to those values as real line wins below.
    jackpot_units = {x_to_payout(px) for px, _ in jackpot_ladder(name, max_win)}
    if name == "unknown_bonus":
        jackpot_units.add(x_to_payout(25_000))
    target_weighted_units = round(TARGET_RTP * cost * 100 * TOTAL_WEIGHT)
    def rows_at_feature_scale(scale: float) -> list[tuple[int, int, int]]:
        scaled_rows = []
        for row_idx, (sim_id, weight, original_payout) in enumerate(rows):
            event = events[row_idx]["events"][0]
            if not event["bonusTriggered"] or original_payout <= 0 or original_payout in jackpot_units:
                scaled_rows.append((sim_id, weight, original_payout))
                continue
            bonus_type = event["bonusType"]
            scatter_count = event["scatterCount"]
            floor = 5_000.0 if scatter_count == 6 else 1_500.0 if scatter_count == 5 else 0.1
            cap = 50_000.0 if bonus_type == "ethereal" else 25_000.0
            amount = min(cap, max(floor, (original_payout / 100.0) * scale))
            scaled_rows.append((sim_id, weight, x_to_payout(amount)))
        return scaled_rows

    def weighted_return(candidate_rows: list[tuple[int, int, int]]) -> int:
        return sum(weight * payout for _, weight, payout in candidate_rows)

    candidate_rows = rows_at_feature_scale(1.0)
    candidate_return = weighted_return(candidate_rows)
    if candidate_return > target_weighted_units:
        # When natural line wins plus the selected feature mix exceed the RTP
        # budget, reduce the frequency of ordinary line wins and move that
        # probability to a zero-win row. Keep every 3/4/5/6-scatter outcome and
        # its tier payout intact. This preserves honest line math and the
        # advertised bonus odds without inventing a line multiplier.
        def feature_return_for(candidate: list[tuple[int, int, int]]) -> int:
            return sum(
                payout * weight
                for (_, weight, payout), event_row in zip(candidate, events)
                if event_row["events"][0]["bonusTriggered"]
            )

        feature_return = feature_return_for(candidate_rows)
        if feature_return > target_weighted_units:
            # Reduce feature outcomes only as far as needed; tier floors remain
            # enforced by rows_at_feature_scale.
            low, high = 0.0, 1.0
            floor_rows = rows_at_feature_scale(0)
            if feature_return_for(floor_rows) > target_weighted_units:
                raise ValueError(f"{name}: protected bonus payouts alone exceed the RTP budget")
            for _ in range(80):
                mid = (low + high) / 2
                if feature_return_for(rows_at_feature_scale(mid)) <= target_weighted_units:
                    low = mid
                else:
                    high = mid
            candidate_rows = rows_at_feature_scale(low)
            feature_return = feature_return_for(candidate_rows)
        ordinary_return = sum(
            payout * weight
            for (_, weight, payout), event_row in zip(candidate_rows, events)
            if not event_row["events"][0]["bonusTriggered"]
        )
        zero_sink = next((i for i, ((_, _, payout), event_row) in enumerate(zip(rows, events))
                          if payout == 0 and not event_row["events"][0]["bonusTriggered"]), None)
        if ordinary_return > 0 and zero_sink is None:
            raise ValueError(f"{name}: cannot rebalance ordinary wins without a zero-win row")
        factor = min(1.0, max(0.0, (target_weighted_units - feature_return) / max(ordinary_return, 1)))
        mutable = list(candidate_rows)
        freed_weight = 0
        for i, ((sim_id, weight, payout), event_row) in enumerate(zip(mutable, events)):
            if payout > 0 and not event_row["events"][0]["bonusTriggered"]:
                adjusted_weight = int(round(weight * factor))
                freed_weight += weight - adjusted_weight
                mutable[i] = (sim_id, adjusted_weight, payout)
        if zero_sink is not None:
            sim_id, weight, payout = mutable[zero_sink]
            mutable[zero_sink] = (sim_id, weight + freed_weight, payout)
        rows = mutable
    else:
        low, high = 0.0, 1.0
        rebalanced = False
        while weighted_return(rows_at_feature_scale(high)) < target_weighted_units:
            high *= 2
            if high > 1_000_000:
                # Awards have reached their mode caps. If ordinary line wins
                # are the limiting factor, transfer some no-win probability
                # into those already-visible connections (never alter a
                # connection's payout or the advertised scatter odds).
                rows = rows_at_feature_scale(1_000_000)
                feature_return = sum(
                    payout * weight for (_, weight, payout), event_row in zip(rows, events)
                    if event_row["events"][0]["bonusTriggered"]
                )
                ordinary_return = sum(
                    payout * weight for (_, weight, payout), event_row in zip(rows, events)
                    if not event_row["events"][0]["bonusTriggered"]
                )
                deficit = target_weighted_units - weighted_return(rows)
                sink = next((i for i, ((_, _, payout), event_row) in enumerate(zip(rows, events))
                             if payout == 0 and not event_row["events"][0]["bonusTriggered"]), None)
                if deficit > 0 and ordinary_return > 0 and sink is not None:
                    factor = 1 + deficit / ordinary_return
                    mutable = list(rows)
                    moved = 0
                    for i, ((sim_id, weight, payout), event_row) in enumerate(zip(mutable, events)):
                        if payout > 0 and not event_row["events"][0]["bonusTriggered"]:
                            new_weight = int(round(weight * factor))
                            moved += new_weight - weight
                            mutable[i] = (sim_id, new_weight, payout)
                    if moved <= mutable[sink][1]:
                        sim_id, weight, payout = mutable[sink]
                        mutable[sink] = (sim_id, weight - moved, payout)
                        rows = mutable
                        rebalanced = True
                        break
                raise ValueError(f"{name}: feature and line payouts cannot fund the target RTP within mode caps")
        if not rebalanced:
            for _ in range(80):
                mid = (low + high) / 2
                if weighted_return(rows_at_feature_scale(mid)) < target_weighted_units:
                    low = mid
                else:
                    high = mid
            rows = rows_at_feature_scale((low + high) / 2)
    for row_idx, (sim_id, _, payout) in enumerate(rows):
        events[row_idx]["payoutMultiplier"] = payout
        events[row_idx]["events"][0]["payoutX"] = round(payout / 100.0, 4)

    # The SDK accepts 0.1x payout increments. Re-center the tiny quantization
    # residual in one feature result while protecting scatter floors and caps.
    current_weighted_units = weighted_return(rows)
    delta_units = target_weighted_units - current_weighted_units
    if delta_units:
        best_adjustment = None
        for row_idx, (sim_id, weight, payout) in enumerate(rows):
            event = events[row_idx]["events"][0]
            if not event["bonusTriggered"] or payout <= 0 or payout in jackpot_units or weight <= 0:
                continue
            scatter_count = event["scatterCount"]
            floor = x_to_payout(5_000 if scatter_count == 6 else 1_500 if scatter_count == 5 else 0.1)
            cap = x_to_payout(50_000 if scatter_count == 6 else 25_000 if scatter_count == 5 else max_win)
            step = round(delta_units / (weight * 10)) * 10
            adjusted = payout + step
            if adjusted < floor or adjusted > cap:
                continue
            residual = abs(delta_units - step * weight)
            if best_adjustment is None or residual < best_adjustment[0]:
                best_adjustment = (residual, row_idx, adjusted)
        if best_adjustment is None:
            achieved = current_weighted_units / (TOTAL_WEIGHT * 100 * cost)
            if abs(achieved - TARGET_RTP) > 0.00001:
                raise ValueError(
                    f"{name}: could not reconcile SDK-rounded RTP without breaking feature limits "
                    f"(achieved {achieved:.8%}, target {TARGET_RTP:.8%})"
                )
        else:
            _, row_idx, adjusted = best_adjustment
            sim_id, weight, _ = rows[row_idx]
            rows[row_idx] = (sim_id, weight, adjusted)
            events[row_idx]["payoutMultiplier"] = adjusted
            events[row_idx]["events"][0]["payoutX"] = round(adjusted / 100.0, 4)

    # Calibrate the displayed bonus multipliers so all actual line wins,
    # including the Wild Surge finale, equal the RGS booked round payout.
    for row_idx, (_, _, payout) in enumerate(rows):
        event = events[row_idx]["events"][0]
        if event["bonusTriggered"]:
            expected_x = payout / 100.0
            visible_total = calibrate_bonus_frame_multipliers(event, expected_x)
            adjusted_payout = x_to_payout(visible_total)
            scatter_count = event["scatterCount"]
            floor = 5_000 if scatter_count == 6 else 1_500 if scatter_count == 5 else 0.1
            cap = 50_000 if scatter_count == 6 else 25_000
            if visible_total + 1e-8 < floor or visible_total > cap + 1e-8:
                raise ValueError(
                    f"{name}: integer-multiplier bonus total {visible_total:.1f}x violates its {floor}x–{cap}x limits"
                )
            is_jackpot_row = (
                payout == x_to_payout(cap)
                or (name == "unknown_bonus" and payout == x_to_payout(24_988))
            )
            if is_jackpot_row and adjusted_payout != payout:
                raise ValueError(
                    f"{name}: whole-number paylines cannot exactly reach the {payout / 100:.1f}x jackpot row"
                )
            sim_id, weight, _ = rows[row_idx]
            rows[row_idx] = (sim_id, weight, adjusted_payout)
            events[row_idx]["payoutMultiplier"] = adjusted_payout
            event["payoutX"] = round(adjusted_payout / 100.0, 4)

    # Rebalance probability mass only within the same scatter-count class.
    # This keeps bonus/scatter hit rates, zero-win frequency, and max-win odds
    # intact after multiplier stops change the exact line payouts.
    jackpot_units = {x_to_payout(px) for px, _ in jackpot_ladder(name, max_win)}
    if name == "unknown_bonus":
        jackpot_units.add(x_to_payout(24_988))
    cap_by_row = [
        x_to_payout(50_000 if event["events"][0].get("scatterCount") == 6 else max_win)
        for event in events
    ]
    groups: dict[int, list[int]] = {}
    for index, event_row in enumerate(events):
        scatter_count = int(event_row["events"][0].get("scatterCount", 0))
        groups.setdefault(scatter_count, []).append(index)

    def weighted_units() -> int:
        return sum(weight * payout for _, weight, payout in rows)

    target_weighted_units = round(TARGET_RTP * cost * 100 * TOTAL_WEIGHT)
    for _ in range(100_000):
        delta = target_weighted_units - weighted_units()
        tolerance = max(1, int(target_weighted_units * 1e-10))
        if abs(delta) <= tolerance:
            break
        direction = 1 if delta > 0 else -1
        moves = []
        for indices in groups.values():
            flexible = [
                i for i in indices
                if rows[i][2] > 0
                and rows[i][2] != cap_by_row[i]
                and rows[i][2] not in jackpot_units
                and rows[i][1] > 0
            ]
            for source in flexible:
                for destination in flexible:
                    difference = direction * (rows[destination][2] - rows[source][2])
                    if difference > 0 and difference <= abs(delta):
                        moves.append((difference, source, destination))
        if not moves:
            break
        difference, source, destination = max(moves, key=lambda item: item[0])
        transferable = rows[source][1]
        amount = min(transferable, abs(delta) // difference)
        if amount <= 0:
            break
        source_id, source_weight, source_payout = rows[source]
        dest_id, dest_weight, dest_payout = rows[destination]
        rows[source] = (source_id, source_weight - amount, source_payout)
        rows[destination] = (dest_id, dest_weight + amount, dest_payout)
    final_delta = target_weighted_units - weighted_units()
    if abs(final_delta) > max(1, int(target_weighted_units * 1e-8)):
        achieved = weighted_units() / (TOTAL_WEIGHT * 100 * cost)
        raise ValueError(
            f"{name}: selectable multipliers cannot retain scatter odds and reach target RTP "
            f"(achieved {achieved:.6%}, target {TARGET_RTP:.6%})"
        )

    # Fail generation unless every line payout adds to the SDK's authoritative
    # round payout, including all saved bonus spins and Wild Surge.
    for row_idx, (_, _, payout) in enumerate(rows):
        event = events[row_idx]["events"][0]
        if payout <= 0:
            continue
        if event["bonusTriggered"]:
            visible_total = sum(
                line_total(frame["board"], 1.0, frame["multiplier"]) * BONUS_PAYOUT_SCALE
                for frame in event["bonusSpinFrames"]
            )
            surge = event.get("wildSurge")
            if surge and surge.get("linesAwarded", 0) > 0:
                visible_total += line_total(
                    surge["frame"]["board"], 1.0, surge["frame"]["multiplier"]
                ) * BONUS_PAYOUT_SCALE
        else:
            visible_total = line_total(event["board"], cost, event["wildMultiplier"])
        if not math.isclose(visible_total, payout / 100.0, rel_tol=0, abs_tol=1e-8):
            raise ValueError(
                f"{name}: visible payout total {visible_total:.10f}x but row {row_idx} books {payout / 100:.2f}x"
            )

    # Write CSV + JSONL + ZST
    PUBLISH_ROOT.mkdir(exist_ok=True)
    csv_path = PUBLISH_ROOT / f"{name}.csv"
    jsonl_path = ROOT / f"{name}.jsonl"
    zst_path = PUBLISH_ROOT / f"{name}.jsonl.zst"

    with csv_path.open("w", encoding="utf-8", newline="\n") as fh:
        for sim_id, weight, payout in rows:
            fh.write(f"{sim_id},{weight},{payout}\n")

    with jsonl_path.open("w", encoding="utf-8", newline="\n") as fh:
        for book in events:
            fh.write(json.dumps(book, separators=(",", ":")) + "\n")

    compressor = zstd.ZstdCompressor(level=10)
    with jsonl_path.open("rb") as src, zst_path.open("wb") as dst:
        compressor.copy_stream(src, dst)

    # Exact stats from integer weights
    total_w = sum(w for _, w, _ in rows)
    rtp_abs = sum(w * payout_to_x(p) for _, w, p in rows) / total_w
    hit = sum(w for _, w, p in rows if p > 0) / total_w
    report = risk_report(
        [(payout_to_x(payout), weight / total_w) for _, weight, payout in rows], cost
    )
    odds_top = report["odds_50k"] if max_win >= 50_000 else report["odds_25k"]
    top_label = "50k" if max_win >= 50_000 else "25k"
    all_pass = (
        report["pass_cvar"]
        and report["pass_tail"]
        and report["pass_vol"]
        and report["pass_bigwin"]
    )
    print(
        f"  {name:16s} cost={cost:6.1f}x  RTP={rtp_abs/cost*100:6.2f}%  "
        f"hit={hit*100:5.1f}%  vol={report['volatility']:5.2f}  "
        f"CVaR={report['cvar_rel']:6.1f}  {top_label}=1/{odds_top:,.0f}  "
        f"{'OK' if all_pass else 'CHECK'}"
    )
    return {
        "name": name,
        "cost": cost,
        "events": f"{name}.jsonl.zst",
        "weights": f"{name}.csv",
        "stats": {
            "rtp": rtp_abs / cost,
            "hit_rate": hit,
            **report,
        },
    }


def main() -> None:
    print("Generating Sea Raider publish math…")
    modes_out = []
    for mode in MODES:
        modes_out.append(build_mode(*mode))

    # Publish the actual start-value range/options for the rules menu and the
    # pre-bonus multiplier reel, directly from the same books sent to Engine.
    start_values_by_scatter: dict[int, set[int]] = {}
    for mode_meta in modes_out:
        for line in (ROOT / f"{mode_meta['name']}.jsonl").read_text(encoding="utf-8").splitlines():
            if not line:
                continue
            event = json.loads(line)["events"][0]
            frames = event.get("bonusSpinFrames") or []
            if event.get("bonusTriggered") and frames:
                start_values_by_scatter.setdefault(int(event["scatterCount"]), set()).add(
                    int(frames[0]["multiplier"])
                )
    start_ranges = {
        str(scatter_count): {
            "min": min(values),
            "max": max(values),
            "values": sorted(values),
        }
        for scatter_count, values in sorted(start_values_by_scatter.items())
    }
    (ROOT / "bonus-multiplier-ranges.json").write_text(
        json.dumps(start_ranges, indent=2) + "\n", encoding="utf-8"
    )

    manifest = {
        "modes": [
            {
                "name": m["name"],
                "cost": m["cost"],
                "events": m["events"],
                "weights": m["weights"],
            }
            for m in modes_out
        ]
    }
    (PUBLISH_ROOT / "index.json").write_text(
        json.dumps(manifest, indent=2) + "\n", encoding="utf-8"
    )

    # Sidecar summary for the frontend / QA
    summary = {
        "targetRtp": TARGET_RTP,
        "modes": {
            m["name"]: {
                "cost": m["cost"],
                "rtp": round(m["stats"]["rtp"], 6),
                "hitRate": round(m["stats"]["hit_rate"], 6),
                "volatility": round(m["stats"]["volatility"], 4),
                "cvarRel": round(m["stats"]["cvar_rel"], 4),
                "rtpFrom40xCost": round(m["stats"]["rtp_from_40x_cost"], 4),
            }
            for m in modes_out
        },
    }
    (ROOT / "math-summary.json").write_text(
        json.dumps(summary, indent=2) + "\n", encoding="utf-8"
    )

    # Compact book tables for local/demo sampling (same weights as publish CSVs)
    book_tables: dict = {"targetRtp": TARGET_RTP, "modes": {}}
    for mode_meta, mode_tuple in zip(modes_out, MODES):
        name = mode_meta["name"]
        csv_rows = (PUBLISH_ROOT / f"{name}.csv").read_text(encoding="utf-8").strip().splitlines()
        jsonl_rows = (ROOT / f"{name}.jsonl").read_text(encoding="utf-8").strip().splitlines()
        entries = []
        for csv_line, jsonl_line in zip(csv_rows, jsonl_rows):
            sim_id, weight, payout = csv_line.split(",")
            book = json.loads(jsonl_line)
            entries.append(
                {
                    "id": int(sim_id),
                    "weight": int(weight),
                    "payoutMultiplier": int(payout),
                    "event": book["events"][0],
                }
            )
        book_tables["modes"][name] = {
            "cost": mode_tuple[1],
            "maxWin": mode_tuple[2],
            "entries": entries,
        }
    (ROOT / "book-tables.json").write_text(
        json.dumps(book_tables, separators=(",", ":")) + "\n", encoding="utf-8"
    )
    print("Wrote publish_files/ + math-summary.json + book-tables.json")


if __name__ == "__main__":
    main()
