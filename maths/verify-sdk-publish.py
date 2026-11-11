import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent / "math-sdk"))

from utils.rgs_verification import (  # noqa: E402
    verify_books_and_payout_mults,
    verify_lookup_format,
)


MODES = [
    "base",
    "bonus_chance",
    "super_bonus",
    "pirates_chance",
    "feature_spin",
    "unknown_bonus",
    "unknown_extreme",
]
ROOT = Path(__file__).parent / "publish_files"

for mode in MODES:
    verify_lookup_format(str(ROOT / f"{mode}.csv"))
    verify_books_and_payout_mults(str(ROOT / f"{mode}.jsonl.zst"))

print(f"SDK format verification passed: {len(MODES)} modes")
