"""Tests for /stats/* and /analytics/recycling.

Expected numbers come from plain SQL on the same database, independent of the pandas code.
"""

import datetime as dt

import pytest
from sqlalchemy import text

from app.database import engine

CATEGORIES = ["organic", "plastic", "paper", "metal", "other"]
BUILDINGS = ["Hostel A", "Hostel B", "Girls Hostel", "Academic Block 1", "Academic Block 2", "Library", "Admin Block"]
approx = lambda v: pytest.approx(v, abs=0.02)  # noqa: E731  (rounding to 2 dp on both sides)


def sql_totals(start=None, end=None, building=None, category=None) -> dict:
    """Totals straight from SQLite: the oracle the API is checked against."""
    where, params = ["1=1"], {}
    for col, op, val in (("date", ">=", start), ("date", "<=", end), ("building", "=", building), ("category", "=", category)):
        if val is not None:
            key = f"p{len(params)}"
            where.append(f"{col} {op} :{key}")
            params[key] = str(val)
    sql = f"""
        SELECT COUNT(*) AS n,
               COALESCE(SUM(weight_kg), 0) AS total,
               COALESCE(SUM(CASE WHEN disposal = 'recycled'  THEN weight_kg END), 0) AS recycled,
               COALESCE(SUM(CASE WHEN disposal = 'composted' THEN weight_kg END), 0) AS composted,
               COALESCE(SUM(CASE WHEN disposal = 'landfill'  THEN weight_kg END), 0) AS landfill
        FROM waste_records WHERE {' AND '.join(where)}"""
    with engine.connect() as conn:
        return dict(conn.execute(text(sql), params).mappings().one())


def sql_date(fn: str) -> dt.date:
    with engine.connect() as conn:
        return dt.date.fromisoformat(conn.execute(text(f"SELECT {fn}(date) FROM waste_records")).scalar())


def is_monday(iso: str) -> bool:
    return dt.date.fromisoformat(iso).weekday() == 0


# =========================================================================== /stats/summary

def test_summary_default_is_last_30_days_of_data(client):
    latest = sql_date("MAX")
    start = latest - dt.timedelta(days=29)
    body = client.get("/api/stats/summary").json()
    exp = sql_totals(start, latest)

    assert set(body) == {"total_kg", "recycled_kg", "composted_kg", "landfill_kg", "recycling_rate", "record_count", "change_vs_prev_period"}
    assert body["record_count"] == exp["n"]
    assert body["total_kg"] == approx(exp["total"])
    assert body["recycled_kg"] == approx(exp["recycled"])
    assert body["composted_kg"] == approx(exp["composted"])
    assert body["landfill_kg"] == approx(exp["landfill"])
    assert body["recycled_kg"] + body["composted_kg"] + body["landfill_kg"] == approx(body["total_kg"])
    assert body["recycling_rate"] == round((exp["recycled"] + exp["composted"]) / exp["total"] * 100, 1)


def test_summary_change_vs_previous_period(client):
    latest = sql_date("MAX")
    cur = sql_totals(latest - dt.timedelta(days=29), latest)
    prev = sql_totals(latest - dt.timedelta(days=59), latest - dt.timedelta(days=30))
    expected = round((cur["total"] - prev["total"]) / prev["total"] * 100, 1)
    assert client.get("/api/stats/summary").json()["change_vs_prev_period"] == pytest.approx(expected, abs=0.1)


def test_summary_explicit_range_and_filters(client):
    start, end = sql_date("MAX") - dt.timedelta(days=13), sql_date("MAX") - dt.timedelta(days=7)
    params = {"start_date": start.isoformat(), "end_date": end.isoformat(), "building": "Hostel B", "category": "organic"}
    body = client.get("/api/stats/summary", params=params).json()
    exp = sql_totals(start, end, "Hostel B", "organic")
    assert body["record_count"] == exp["n"] > 0
    assert body["total_kg"] == approx(exp["total"])
    assert body["recycled_kg"] == 0 and body["composted_kg"] == approx(exp["composted"])  # organic is composted
    assert body["record_count"] == client.get("/api/records", params=params).json()["total"]


def test_summary_prev_period_without_data_is_null(client):
    first = sql_date("MIN")
    body = client.get("/api/stats/summary", params={"start_date": first.isoformat(), "end_date": (first + dt.timedelta(days=6)).isoformat()}).json()
    assert body["record_count"] > 0 and body["change_vs_prev_period"] is None


def test_summary_all_time(client):
    body = client.get("/api/stats/summary", params={"start_date": "1970-01-01"}).json()
    exp = sql_totals()
    assert body["record_count"] == exp["n"] and body["total_kg"] == approx(exp["total"])


def test_summary_window_with_no_data_is_zeros(client):
    body = client.get("/api/stats/summary", params={"start_date": "2020-01-01", "end_date": "2020-01-31"}).json()
    assert body == {"total_kg": 0, "recycled_kg": 0, "composted_kg": 0, "landfill_kg": 0, "recycling_rate": 0, "record_count": 0, "change_vs_prev_period": None}


@pytest.mark.parametrize("params,field", [({"start_date": "2026-10-10", "end_date": "2026-10-01"}, "start_date"), ({"building": "Mars"}, "building")])
def test_summary_invalid_filters_are_422(client, params, field):
    res = client.get("/api/stats/summary", params=params)
    assert res.status_code == 422 and field in [e["field"] for e in res.json()["errors"]]


# =========================================================================== /stats/daily

def test_daily_default_30_consecutive_days_ending_at_latest(client):
    days = client.get("/api/stats/daily").json()
    dates = [dt.date.fromisoformat(d["date"]) for d in days]
    assert len(days) == 30 and dates[-1] == sql_date("MAX")
    assert all((b - a).days == 1 for a, b in zip(dates, dates[1:]))
    assert set(days[0]) == {"date", "total_kg", "recycled_kg", "landfill_kg"}


def test_daily_values_match_sql(client):
    days = client.get("/api/stats/daily", params={"days": 7}).json()
    assert len(days) == 7
    for d in days:
        exp = sql_totals(d["date"], d["date"])
        assert d["total_kg"] == approx(exp["total"])
        assert d["recycled_kg"] == approx(exp["recycled"] + exp["composted"])
        assert d["landfill_kg"] == approx(exp["landfill"])
        assert d["recycled_kg"] + d["landfill_kg"] == approx(d["total_kg"])


def test_daily_sum_matches_summary(client):
    total = sum(d["total_kg"] for d in client.get("/api/stats/daily").json())
    assert total == pytest.approx(client.get("/api/stats/summary").json()["total_kg"], abs=0.5)


def test_daily_fills_missing_days_with_zero(client):
    # The window straddles the first data day: earlier days must be present with zeros.
    first = sql_date("MIN")
    end = first + dt.timedelta(days=4)
    days = client.get("/api/stats/daily", params={"days": 10, "end_date": end.isoformat()}).json()
    assert len(days) == 10
    before = [d for d in days if dt.date.fromisoformat(d["date"]) < first]
    after = [d for d in days if dt.date.fromisoformat(d["date"]) >= first]
    assert len(before) == 5 and all(d["total_kg"] == d["recycled_kg"] == d["landfill_kg"] == 0 for d in before)
    assert all(d["total_kg"] > 0 for d in after)


def test_daily_start_date_overrides_days(client):
    latest = sql_date("MAX")
    days = client.get("/api/stats/daily", params={"days": 3, "start_date": (latest - dt.timedelta(days=9)).isoformat()}).json()
    assert len(days) == 10


def test_daily_respects_building_filter(client):
    d = client.get("/api/stats/daily", params={"days": 1, "building": "Library"}).json()[0]
    assert d["total_kg"] == approx(sql_totals(d["date"], d["date"], building="Library")["total"])


@pytest.mark.parametrize("days", [0, 366, "x"])
def test_daily_invalid_days_is_422(client, days):
    assert client.get("/api/stats/daily", params={"days": days}).status_code == 422


# =========================================================================== /stats/weekly

def test_weekly_default_12_monday_weeks(client):
    weeks = client.get("/api/stats/weekly").json()
    starts = [dt.date.fromisoformat(w["week_start"]) for w in weeks]
    assert len(weeks) == 12 and all(is_monday(w["week_start"]) for w in weeks)
    assert all((b - a).days == 7 for a, b in zip(starts, starts[1:]))
    latest = sql_date("MAX")
    assert starts[-1] <= latest < starts[-1] + dt.timedelta(days=7)  # last week contains the latest data


def test_weekly_values_match_sql(client):
    for w in client.get("/api/stats/weekly", params={"weeks": 4}).json():
        start = dt.date.fromisoformat(w["week_start"])
        exp = sql_totals(start, start + dt.timedelta(days=6))
        assert w["total_kg"] == approx(exp["total"])
        assert w["recycled_kg"] == approx(exp["recycled"] + exp["composted"])
        assert w["landfill_kg"] == approx(exp["landfill"])


def test_weekly_zero_fills_weeks_before_data(client):
    weeks = client.get("/api/stats/weekly", params={"weeks": 30}).json()  # 30 weeks > 120 days of data
    assert len(weeks) == 30
    assert weeks[0]["total_kg"] == 0 and weeks[-1]["total_kg"] > 0


@pytest.mark.parametrize("weeks", [0, 105])
def test_weekly_invalid_weeks_is_422(client, weeks):
    assert client.get("/api/stats/weekly", params={"weeks": weeks}).status_code == 422


# =========================================================================== /stats/buildings

def test_buildings_all_seven_sorted_and_correct(client):
    rows = client.get("/api/stats/buildings").json()
    assert sorted(r["building"] for r in rows) == sorted(BUILDINGS)
    assert [r["total_kg"] for r in rows] == sorted((r["total_kg"] for r in rows), reverse=True)
    for r in rows:
        exp = sql_totals(building=r["building"])
        assert r["total_kg"] == approx(exp["total"])
        assert r["recycled_kg"] == approx(exp["recycled"] + exp["composted"])
        assert r["landfill_kg"] == approx(exp["landfill"])
        assert r["recycling_rate"] == round((exp["recycled"] + exp["composted"]) / exp["total"] * 100, 1)
    types = {r["building"]: r["building_type"] for r in rows}
    assert types["Hostel B"] == "hostel" and types["Admin Block"] == "academic"


def test_buildings_hostels_produce_more_waste(client):
    rows = client.get("/api/stats/buildings").json()
    assert all(r["building_type"] == "hostel" for r in rows[:3])  # seeded pattern


def test_buildings_with_no_data_still_lists_all_seven(client):
    rows = client.get("/api/stats/buildings", params={"end_date": "2020-01-01"}).json()
    assert len(rows) == 7 and all(r["total_kg"] == r["recycling_rate"] == 0 for r in rows)


def test_buildings_category_filter(client):
    rows = client.get("/api/stats/buildings", params={"category": "paper"}).json()
    lib = next(r for r in rows if r["building"] == "Library")
    assert lib["total_kg"] == approx(sql_totals(building="Library", category="paper")["total"])


# =========================================================================== /stats/categories

def test_categories_all_five_sorted_with_percent(client):
    rows = client.get("/api/stats/categories").json()
    assert sorted(r["category"] for r in rows) == sorted(CATEGORIES)
    assert [r["total_kg"] for r in rows] == sorted((r["total_kg"] for r in rows), reverse=True)
    assert sum(r["percent"] for r in rows) == pytest.approx(100, abs=0.3)
    grand = sql_totals()["total"]
    for r in rows:
        exp = sql_totals(category=r["category"])["total"]
        assert r["total_kg"] == approx(exp)
        assert r["percent"] == round(exp / grand * 100, 1)
    assert rows[0]["category"] == "organic"  # seeded pattern


def test_categories_building_filter(client):
    rows = client.get("/api/stats/categories", params={"building": "Library"}).json()
    assert rows[0]["category"] == "paper"  # the library is paper-heavy


def test_categories_with_no_data_are_zero(client):
    rows = client.get("/api/stats/categories", params={"end_date": "2020-01-01"}).json()
    assert len(rows) == 5 and all(r["total_kg"] == r["percent"] == 0 for r in rows)


# =========================================================================== /analytics/recycling

def test_analytics_shape_and_trend(client):
    body = client.get("/api/analytics/recycling").json()
    assert set(body) == {"trend", "best_building", "worst_building", "insights"}
    trend = body["trend"]
    assert len(trend) == 12 and all(is_monday(t["week_start"]) for t in trend)
    for t in trend[:-1]:  # check full weeks against SQL
        start = dt.date.fromisoformat(t["week_start"])
        exp = sql_totals(start, start + dt.timedelta(days=6))
        assert t["total_kg"] == approx(exp["total"])
        assert t["diverted_kg"] == approx(exp["recycled"] + exp["composted"])
        assert t["recycling_rate"] == round((exp["recycled"] + exp["composted"]) / exp["total"] * 100, 1)
    assert trend[-2]["recycling_rate"] > trend[0]["recycling_rate"]  # seeded: recycling improves


def test_analytics_best_and_worst_building(client):
    body = client.get("/api/analytics/recycling").json()
    rates = {r["building"]: r["recycling_rate"] for r in client.get("/api/stats/buildings").json()}
    assert body["best_building"]["recycling_rate"] == max(rates.values())
    assert body["worst_building"]["recycling_rate"] == min(rates.values())
    assert body["best_building"]["building"] == "Library" and body["worst_building"]["building"] == "Hostel A"  # seeded
    assert set(body["best_building"]) == {"building", "building_type", "recycling_rate"}


def test_analytics_insights_are_3_to_5_sentences(client):
    insights = client.get("/api/analytics/recycling").json()["insights"]
    assert 3 <= len(insights) <= 5
    assert all(isinstance(s, str) and len(s) > 20 and s.endswith(".") for s in insights)
    assert len(set(insights)) == len(insights)
    assert any("Library" in s and "highest" in s for s in insights)


def test_analytics_single_building_still_has_insights(client):
    body = client.get("/api/analytics/recycling", params={"building": "Admin Block"}).json()
    assert body["best_building"]["building"] == body["worst_building"]["building"] == "Admin Block"
    assert 3 <= len(body["insights"]) <= 5


def test_analytics_period_with_no_data(client):
    body = client.get("/api/analytics/recycling", params={"start_date": "2020-01-01", "end_date": "2020-03-01"}).json()
    assert len(body["trend"]) == 12 and all(t["total_kg"] == t["recycling_rate"] == 0 for t in body["trend"])
    assert body["best_building"] is None and body["worst_building"] is None and body["insights"] == []


# =========================================================================== empty database

def test_empty_database_never_crashes(empty_client):
    c = empty_client
    assert c.get("/api/health").json()["records"] == 0
    assert c.get("/api/records").json() == {"items": [], "total": 0, "page": 1, "page_size": 20}

    assert c.get("/api/stats/summary").json() == {
        "total_kg": 0, "recycled_kg": 0, "composted_kg": 0, "landfill_kg": 0,
        "recycling_rate": 0, "record_count": 0, "change_vs_prev_period": None,
    }

    daily = c.get("/api/stats/daily").json()
    assert len(daily) == 30 and daily[-1]["date"] == dt.date.today().isoformat()
    assert all(d["total_kg"] == 0 for d in daily)

    weekly = c.get("/api/stats/weekly").json()
    assert len(weekly) == 12 and all(w["total_kg"] == 0 for w in weekly)

    buildings = c.get("/api/stats/buildings").json()
    assert len(buildings) == 7 and all(b["total_kg"] == b["recycling_rate"] == 0 for b in buildings)

    categories = c.get("/api/stats/categories").json()
    assert len(categories) == 5 and all(x["percent"] == 0 for x in categories)

    analytics = c.get("/api/analytics/recycling").json()
    assert len(analytics["trend"]) == 12
    assert analytics["best_building"] is None and analytics["worst_building"] is None and analytics["insights"] == []


@pytest.mark.parametrize(
    "path", ["/api/stats/summary", "/api/stats/daily", "/api/stats/weekly", "/api/stats/buildings", "/api/stats/categories", "/api/analytics/recycling"]
)
def test_empty_database_with_filters(empty_client, path):
    res = empty_client.get(path, params={"building": "Library", "category": "paper", "start_date": "2026-01-01"})
    assert res.status_code == 200, res.text
