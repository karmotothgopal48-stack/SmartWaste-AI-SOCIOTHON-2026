"""Generates realistic demo data. Same patterns as frontend/src/services/mockData.js:

- hostels produce far more (mostly organic) waste; academic blocks are paper-heavy
- weekends: hostels slightly busier, academic blocks mostly empty
- a mild upward trend in volume, and recycling that slowly improves over time
- each building has its own segregation habits (Library best, Hostel A worst)

Runs automatically at startup only when the table is empty, so restarts never duplicate data.
Manual use (from the backend folder):
    python -m app.seed            # seed if empty
    python -m app.seed --reset    # wipe and re-seed
"""

import argparse
import datetime as dt
import random

from sqlalchemy import delete, func, insert, select
from sqlalchemy.orm import Session

from .constants import BUILDINGS, CATEGORIES
from .models import WasteRecord

DAYS_OF_DATA = 120
RANDOM_SEED = 2026

# Typical kg/day per category on a weekday.
PROFILES: dict[str, dict[str, float]] = {
    "Hostel A":         {"organic": 42, "plastic": 14, "paper": 6,  "metal": 2.5, "other": 7},
    "Hostel B":         {"organic": 48, "plastic": 17, "paper": 7,  "metal": 3,   "other": 8},
    "Girls Hostel":     {"organic": 34, "plastic": 11, "paper": 6,  "metal": 2,   "other": 5},
    "Academic Block 1": {"organic": 7,  "plastic": 9,  "paper": 19, "metal": 1.5, "other": 4},
    "Academic Block 2": {"organic": 6,  "plastic": 8,  "paper": 16, "metal": 1.5, "other": 3.5},
    "Library":          {"organic": 2,  "plastic": 4,  "paper": 14, "metal": 0.8, "other": 2},
    "Admin Block":      {"organic": 3,  "plastic": 4,  "paper": 9,  "metal": 0.8, "other": 2},
}

# Weekend volume multiplier.
WEEKEND_FACTOR = {
    "Hostel A": 1.08, "Hostel B": 1.1, "Girls Hostel": 1.05,
    "Academic Block 1": 0.3, "Academic Block 2": 0.28, "Library": 0.55, "Admin Block": 0.15,
}

# How good each building is at segregation (added to the diversion share).
SEGREGATION_BONUS = {
    "Hostel A": -0.12, "Hostel B": -0.04, "Girls Hostel": 0.04,
    "Academic Block 1": 0.02, "Academic Block 2": -0.02, "Library": 0.1, "Admin Block": 0.05,
}

# Share diverted from landfill at the start → end of the period, and how.
DIVERSION = {
    "organic": (0.38, 0.62, "composted"),
    "plastic": (0.42, 0.62, "recycled"),
    "paper":   (0.58, 0.78, "recycled"),
    "metal":   (0.78, 0.90, "recycled"),
    "other":   (0.06, 0.14, "recycled"),
}

NOTES = {
    "organic": ["Mess kitchen waste", "Canteen leftovers", "Garden trimmings"],
    "plastic": ["PET bottles", "Food delivery packaging", "Mixed wrappers"],
    "paper": ["Printouts and notebooks", "Cardboard boxes", "Newspapers"],
    "metal": ["Aluminium cans", "Scrap from maintenance"],
    "other": ["E-waste handed to vendor", "Textiles", "Unsegregated bag"],
}


def generate_records(days: int = DAYS_OF_DATA, end: dt.date | None = None, seed: int = RANDOM_SEED) -> list[dict]:
    """Return `days` days of records ending on `end` (default: today) as plain dicts."""
    rng = random.Random(seed)
    end = end or dt.date.today()
    start = end - dt.timedelta(days=days - 1)
    rows: list[dict] = []

    for i in range(days):
        day = start + dt.timedelta(days=i)
        progress = i / max(1, days - 1)
        growth = 1 + 0.0012 * i  # mild upward trend in volume
        weekend = day.weekday() >= 5

        for building, building_type in BUILDINGS.items():
            day_factor = WEEKEND_FACTOR[building] if weekend else 1.0
            for category in CATEGORIES:
                # Metal and "other" are not collected every day.
                if category in ("metal", "other") and rng.random() < 0.35:
                    continue

                noise = 0.78 + rng.random() * 0.44
                weight = PROFILES[building][category] * day_factor * growth * noise
                if weight < 0.2:
                    continue

                lo, hi, method = DIVERSION[category]
                share = lo + (hi - lo) * progress + SEGREGATION_BONUS[building] + (rng.random() - 0.5) * 0.12
                share = min(0.97, max(0.0, share))
                diverted = round(weight * share, 2)
                landfill = round(weight - diverted, 2)
                note = rng.choice(NOTES[category]) if rng.random() < 0.12 else None

                base = {"date": day, "building": building, "building_type": building_type, "category": category}
                if diverted >= 0.1:
                    rows.append({**base, "weight_kg": diverted, "disposal": method, "notes": note})
                if landfill >= 0.1:
                    rows.append({**base, "weight_kg": landfill, "disposal": "landfill", "notes": None})
    return rows


def record_count(db: Session) -> int:
    return db.scalar(select(func.count()).select_from(WasteRecord)) or 0


def seed_if_empty(db: Session) -> int:
    """Insert demo data only when the table has no rows. Returns the number of rows inserted."""
    if record_count(db) > 0:
        return 0
    rows = generate_records()
    db.execute(insert(WasteRecord), rows)  # one executemany, one transaction
    db.commit()
    return len(rows)


def reset_and_seed(db: Session) -> int:
    db.execute(delete(WasteRecord))
    db.commit()
    return seed_if_empty(db)


if __name__ == "__main__":
    from .database import Base, SessionLocal, engine

    parser = argparse.ArgumentParser(description="Seed the SmartWaste AI database with demo data.")
    parser.add_argument("--reset", action="store_true", help="delete all records first, then seed")
    args = parser.parse_args()

    Base.metadata.create_all(engine)
    with SessionLocal() as session:
        inserted = reset_and_seed(session) if args.reset else seed_if_empty(session)
        total = record_count(session)
    print(f"Inserted {inserted} records. Total now: {total}.")
