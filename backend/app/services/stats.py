"""Aggregations for /stats/* and /analytics/recycling, computed with pandas.

Every function loads the filtered rows once into a DataFrame and aggregates in memory
(a campus has thousands of rows, not millions). All of them work on an empty table:
windows then anchor on today and every number is 0.
"""

import datetime as dt
from dataclasses import replace

import pandas as pd
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..constants import BUILDINGS, CATEGORIES
from ..models import WasteRecord
from .records import RecordFilters, apply_filters

SUMMARY_DEFAULT_DAYS = 30
MAX_DAILY_DAYS = 365
TREND_WEEKS = 12
MAX_INSIGHTS = 5

_COLUMNS = (
    WasteRecord.date,
    WasteRecord.building,
    WasteRecord.building_type,
    WasteRecord.category,
    WasteRecord.weight_kg,
    WasteRecord.disposal,
)
_SUMS = ["weight_kg", "recycled", "composted", "diverted", "landfill"]


# --------------------------------------------------------------------------- helpers

def kg(x) -> float:
    """Round a weight to 2 dp as a plain float (never -0.0)."""
    return round(float(x), 2) + 0.0


def rate(diverted, total) -> float:
    """Recycling rate % to 1 dp; 0 when there is no waste."""
    return round(float(diverted) / float(total) * 100, 1) + 0.0 if total > 0 else 0.0


def pct_change(cur, prev) -> float | None:
    return round((float(cur) - float(prev)) / float(prev) * 100, 1) + 0.0 if prev > 0 else None


def latest_date(db: Session) -> dt.date:
    """Latest record date across the whole table (today when empty). Windows anchor here."""
    return db.scalar(select(func.max(WasteRecord.date))) or dt.date.today()


def monday_of(day: dt.date) -> dt.date:
    return day - dt.timedelta(days=day.weekday())


def load_frame(db: Session, f: RecordFilters) -> pd.DataFrame:
    """Filtered records as a DataFrame with per-disposal weight columns ready to sum."""
    rows = db.execute(apply_filters(select(*_COLUMNS), f)).all()
    df = pd.DataFrame(rows, columns=[c.key for c in _COLUMNS])
    df["date"] = pd.to_datetime(df["date"])
    df["weight_kg"] = df["weight_kg"].astype("float64")
    for disposal in ("recycled", "composted", "landfill"):
        df[disposal] = df["weight_kg"].where(df["disposal"] == disposal, 0.0)
    df["diverted"] = df["recycled"] + df["composted"]
    return df


def _totals(df: pd.DataFrame) -> pd.Series:
    return df[_SUMS].sum() if len(df) else pd.Series(0.0, index=_SUMS)


def _week_start(dates: pd.Series) -> pd.Series:
    return dates - pd.to_timedelta(dates.dt.day_of_week, unit="D")


def _weekly_frame(df: pd.DataFrame, weeks: int, end: dt.date) -> pd.DataFrame:
    """One row per Monday-start week (oldest first), zero-filled, covering `weeks` weeks up to `end`."""
    last = pd.Timestamp(monday_of(end))
    index = pd.date_range(end=last, periods=weeks, freq="7D")
    if len(df):
        grouped = df.assign(week=_week_start(df["date"])).groupby("week")[_SUMS].sum()
    else:
        grouped = pd.DataFrame(columns=_SUMS, dtype="float64")
    return grouped.reindex(index, fill_value=0.0)


def _by_building(df: pd.DataFrame) -> pd.DataFrame:
    """All 7 buildings (zero-filled), in the canonical order."""
    grouped = df.groupby("building")[_SUMS].sum() if len(df) else pd.DataFrame(columns=_SUMS, dtype="float64")
    return grouped.reindex(list(BUILDINGS), fill_value=0.0)


# --------------------------------------------------------------------------- endpoints

def summary(db: Session, f: RecordFilters) -> dict:
    end = f.end_date or latest_date(db)
    start = f.start_date or end - dt.timedelta(days=SUMMARY_DEFAULT_DAYS - 1)
    end = max(end, start)  # a start_date after the latest data → a window with no records
    length = (end - start).days + 1
    prev_end = start - dt.timedelta(days=1)
    prev_start = prev_end - dt.timedelta(days=length - 1)

    cur = load_frame(db, replace(f, start_date=start, end_date=end))
    prev = load_frame(db, replace(f, start_date=prev_start, end_date=prev_end))
    t, p = _totals(cur), _totals(prev)

    return {
        "total_kg": kg(t.weight_kg),
        "recycled_kg": kg(t.recycled),
        "composted_kg": kg(t.composted),
        "landfill_kg": kg(t.landfill),
        "recycling_rate": rate(t.diverted, t.weight_kg),
        "record_count": len(cur),
        "change_vs_prev_period": pct_change(t.weight_kg, p.weight_kg) if len(prev) else None,
    }


def daily(db: Session, days: int, f: RecordFilters) -> list[dict]:
    end = f.end_date or latest_date(db)
    start = f.start_date or end - dt.timedelta(days=days - 1)
    start = max(start, end - dt.timedelta(days=MAX_DAILY_DAYS - 1))  # cap very long explicit ranges
    if start > end:
        return []

    df = load_frame(db, replace(f, start_date=start, end_date=end))
    grouped = df.groupby("date")[_SUMS].sum() if len(df) else pd.DataFrame(columns=_SUMS, dtype="float64")
    grouped = grouped.reindex(pd.date_range(start, end, freq="D"), fill_value=0.0)

    return [
        {"date": day.date(), "total_kg": kg(r.weight_kg), "recycled_kg": kg(r.diverted), "landfill_kg": kg(r.landfill)}
        for day, r in grouped.iterrows()
    ]


def weekly(db: Session, weeks: int, f: RecordFilters) -> list[dict]:
    end = f.end_date or latest_date(db)
    first = monday_of(end) - dt.timedelta(weeks=weeks - 1)
    start = max(first, f.start_date) if f.start_date else first
    df = load_frame(db, replace(f, start_date=start, end_date=end))

    return [
        {"week_start": week.date(), "total_kg": kg(r.weight_kg), "recycled_kg": kg(r.diverted), "landfill_kg": kg(r.landfill)}
        for week, r in _weekly_frame(df, weeks, end).iterrows()
    ]


def buildings(db: Session, f: RecordFilters) -> list[dict]:
    grouped = _by_building(load_frame(db, f))
    rows = [
        {
            "building": name,
            "building_type": BUILDINGS[name],
            "total_kg": kg(r.weight_kg),
            "recycled_kg": kg(r.diverted),
            "landfill_kg": kg(r.landfill),
            "recycling_rate": rate(r.diverted, r.weight_kg),
        }
        for name, r in grouped.iterrows()
    ]
    return sorted(rows, key=lambda b: b["total_kg"], reverse=True)  # stable: ties keep canonical order


def categories(db: Session, f: RecordFilters) -> list[dict]:
    df = load_frame(db, f)
    grouped = df.groupby("category")["weight_kg"].sum() if len(df) else pd.Series(dtype="float64")
    grouped = grouped.reindex(list(CATEGORIES), fill_value=0.0)
    grand = float(grouped.sum())
    rows = [
        {"category": c, "total_kg": kg(total), "percent": round(total / grand * 100, 1) + 0.0 if grand > 0 else 0.0}
        for c, total in grouped.items()
    ]
    return sorted(rows, key=lambda c: c["total_kg"], reverse=True)


def recycling_analytics(db: Session, f: RecordFilters) -> dict:
    df = load_frame(db, f)
    end = f.end_date or latest_date(db)

    trend = [
        {"week_start": week.date(), "recycling_rate": rate(r.diverted, r.weight_kg), "total_kg": kg(r.weight_kg), "diverted_kg": kg(r.diverted)}
        for week, r in _weekly_frame(df, TREND_WEEKS, end).iterrows()
    ]

    per_building = _by_building(df)
    per_building = per_building[per_building.weight_kg > 0]
    ranked = sorted(
        (
            {"building": name, "building_type": BUILDINGS[name], "recycling_rate": rate(r.diverted, r.weight_kg)}
            for name, r in per_building.iterrows()
        ),
        key=lambda b: b["recycling_rate"],
        reverse=True,
    )

    return {
        "trend": trend,
        "best_building": ranked[0] if ranked else None,
        "worst_building": ranked[-1] if ranked else None,
        "insights": build_insights(df, ranked, end) if len(df) else [],
    }


# --------------------------------------------------------------------------- insights

def _window(df: pd.DataFrame, end: dt.date, days: int, offset: int = 0) -> pd.DataFrame:
    """Rows in the `days`-day window ending `offset` days before `end`."""
    hi = pd.Timestamp(end - dt.timedelta(days=offset))
    lo = hi - pd.Timedelta(days=days - 1)
    return df[(df["date"] >= lo) & (df["date"] <= hi)]


def build_insights(df: pd.DataFrame, ranked: list[dict], end: dt.date) -> list[str]:
    """3–5 plain-English findings, most actionable first. Each rule only fires when the data supports it."""
    insights: list[str] = []

    if ranked:
        best = ranked[0]
        insights.append(f"{best['building']} recycles {best['recycling_rate']}% of its waste, the highest on campus.")
    if len(ranked) > 1:
        worst = ranked[-1]
        insights.append(
            f"{worst['building']} has the lowest recycling rate ({worst['recycling_rate']}%). "
            "Better segregation bins there would have the biggest impact."
        )

    # Biggest week-over-week move for a building × category pair (ignoring tiny volumes).
    this_week = _window(df, end, 7).groupby(["building", "category"])["weight_kg"].sum()
    last_week = _window(df, end, 7, offset=7).groupby(["building", "category"])["weight_kg"].sum()
    both = pd.concat({"cur": this_week, "prev": last_week}, axis=1).fillna(0.0)
    both = both[both["prev"] >= 15]
    if len(both):
        change = (both["cur"] - both["prev"]) / both["prev"] * 100
        (building, category), value = change.abs().idxmax(), change.loc[change.abs().idxmax()]
        if abs(value) >= 5:
            direction = "rose" if value > 0 else "fell"
            insights.append(f"{category.capitalize()} waste from {building} {direction} {abs(round(value))}% compared with last week.")

    # Recycling-rate trend: last 4 weeks vs the 4 before.
    recent, earlier = _totals(_window(df, end, 28)), _totals(_window(df, end, 28, offset=28))
    if recent.weight_kg > 0 and earlier.weight_kg > 0:
        delta = round(rate(recent.diverted, recent.weight_kg) - rate(earlier.diverted, earlier.weight_kg), 1)
        if abs(delta) >= 0.5:
            insights.append(f"The recycling rate {'improved' if delta > 0 else 'dropped'} by {abs(delta)} points over the last 4 weeks.")

    last30 = _totals(_window(df, end, 30))
    if last30.diverted > 0:
        insights.append(f"Campus diverted {round(last30.diverted):,} kg from landfill in the last 30 days.")

    # Hostels vs academic blocks, per building.
    per_type = df.groupby("building_type")["weight_kg"].sum()
    n_buildings = pd.Series(BUILDINGS).value_counts()
    if per_type.get("hostel", 0) > 0 and per_type.get("academic", 0) > 0:
        ratio = (per_type["hostel"] / n_buildings["hostel"]) / (per_type["academic"] / n_buildings["academic"])
        insights.append(f"An average hostel produces {ratio:.1f}× the waste of an average academic building.")

    # Fallbacks so narrow filters (e.g. one building) still get at least 3 insights.
    if len(insights) < 3:
        by_cat = df.groupby("category")["weight_kg"].sum().sort_values(ascending=False)
        top, share = by_cat.index[0], by_cat.iloc[0] / by_cat.sum() * 100
        insights.append(f"{top.capitalize()} is the largest category at {share:.0f}% of all waste by weight.")
    if len(insights) < 3:
        total = _totals(df)
        landfill_share = total.landfill / total.weight_kg * 100 if total.weight_kg else 0
        insights.append(f"{landfill_share:.0f}% of the {round(total.weight_kg):,} kg logged went to landfill.")

    return insights[:MAX_INSIGHTS]
