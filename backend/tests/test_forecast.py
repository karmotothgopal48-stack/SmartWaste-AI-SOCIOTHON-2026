"""Tests for GET /api/forecast (normal data, short histories, empty database)."""

import datetime as dt

import numpy as np
import pytest
from sqlalchemy import text

from app.database import engine

NOTE = "Forecasts are estimates, not guaranteed values."


def sql_daily_totals() -> dict[str, float]:
    with engine.connect() as conn:
        rows = conn.execute(text("SELECT date, SUM(weight_kg) FROM waste_records GROUP BY date")).all()
    return {str(d): float(kg) for d, kg in rows}


def consecutive(dates: list[str]) -> bool:
    ds = [dt.date.fromisoformat(d) for d in dates]
    return all((b - a).days == 1 for a, b in zip(ds, ds[1:]))


@pytest.fixture(scope="module")
def fc(client):
    res = client.get("/api/forecast")
    assert res.status_code == 200, res.text
    return res.json()


# =========================================================================== normal data (120 days)

def test_shape_matches_contract(fc):
    assert set(fc) == {"history", "forecast", "model", "metrics", "note", "status"}
    assert fc["status"] == "ok" and fc["model"] == "random_forest"
    assert set(fc["metrics"]) == {"mae", "baseline_mae", "holdout_days"}
    assert set(fc["history"][0]) == {"date", "actual_kg"}
    assert set(fc["forecast"][0]) == {"date", "predicted_kg", "lower", "upper"}


def test_note_always_starts_with_disclaimer(fc):
    assert fc["note"].startswith(NOTE)


def test_history_is_last_30_days_of_actuals(fc):
    history = fc["history"]
    totals = sql_daily_totals()
    assert len(history) == 30 and consecutive([h["date"] for h in history])
    assert history[-1]["date"] == max(totals)
    for h in history:
        assert h["actual_kg"] == pytest.approx(totals.get(h["date"], 0.0), abs=0.02)


def test_forecast_is_next_7_days(fc):
    dates = [f["date"] for f in fc["forecast"]]
    assert len(dates) == 7 and consecutive(dates)
    assert dt.date.fromisoformat(dates[0]) == dt.date.fromisoformat(fc["history"][-1]["date"]) + dt.timedelta(days=1)


def test_band_is_prediction_plus_minus_1_5_mae(fc):
    band = 1.5 * fc["metrics"]["mae"]
    for f in fc["forecast"]:
        assert 0 <= f["lower"] <= f["predicted_kg"] <= f["upper"]
        assert f["upper"] == pytest.approx(f["predicted_kg"] + band, abs=0.02)
        assert f["lower"] == pytest.approx(max(0.0, f["predicted_kg"] - band), abs=0.02)


def test_metrics_are_present_and_sensible(fc):
    m = fc["metrics"]
    mean_daily = np.mean([h["actual_kg"] for h in fc["history"]])
    assert m["holdout_days"] == 14
    assert 0 < m["mae"] < 0.25 * mean_daily          # within 25% of a typical day
    assert 0 < m["baseline_mae"] < 0.5 * mean_daily


def test_baseline_mae_is_same_day_last_week(fc):
    """Recompute the naive baseline from the returned history: the 14 held-out days are the last 14,
    and the naive forecast repeats the week just before them."""
    actual = [h["actual_kg"] for h in fc["history"]]
    holdout, last_week = actual[-14:], actual[-21:-14]
    naive = [last_week[i % 7] for i in range(14)]
    expected = np.mean(np.abs(np.array(holdout) - np.array(naive)))
    assert fc["metrics"]["baseline_mae"] == pytest.approx(expected, abs=0.05)


def test_predictions_are_plausible(fc):
    recent = [h["actual_kg"] for h in fc["history"][-28:]]
    for f in fc["forecast"]:
        assert 0.6 * min(recent) <= f["predicted_kg"] <= 1.4 * max(recent)


def test_model_learns_the_weekend_dip(fc):
    """Seeded data: academic blocks empty out at weekends, so campus totals drop."""
    by_weekend = {True: [], False: []}
    for f in fc["forecast"]:
        by_weekend[dt.date.fromisoformat(f["date"]).weekday() >= 5].append(f["predicted_kg"])
    assert np.mean(by_weekend[True]) < np.mean(by_weekend[False])


@pytest.mark.parametrize("days", [1, 14])
def test_days_parameter(client, days):
    body = client.get("/api/forecast", params={"days": days}).json()
    assert len(body["forecast"]) == days and consecutive([f["date"] for f in body["forecast"]])


@pytest.mark.parametrize("days", [0, 15, "week"])
def test_invalid_days_is_422(client, days):
    res = client.get("/api/forecast", params={"days": days})
    assert res.status_code == 422 and res.json()["errors"][0]["field"] == "days"


def test_is_deterministic(client, fc):
    assert client.get("/api/forecast").json() == fc


def test_forecast_updates_when_data_changes(client, fc):
    """The cache is keyed on the data: a big new record must change the result."""
    latest = fc["history"][-1]["date"]
    rec = client.post("/api/records", json={
        "date": latest, "building": "Hostel B", "category": "organic",
        "weight_kg": 2500, "disposal": "composted", "notes": "forecast cache test",
    }).json()
    try:
        changed = client.get("/api/forecast").json()
        assert changed["history"][-1]["actual_kg"] == pytest.approx(fc["history"][-1]["actual_kg"] + 2500, abs=0.02)
        assert changed["forecast"] != fc["forecast"]
    finally:
        client.delete(f"/api/records/{rec['id']}")
    assert client.get("/api/forecast").json() == fc  # back to the original data → same forecast


# =========================================================================== model quality (back-test)

def test_model_beats_naive_baseline_in_backtest():
    """Same protocol as the API (14-day hold-out, recursive), on 14 datasets with fixed end dates so the
    result doesn't depend on today's date. Guards against changes that make the model worse than naive."""
    import pandas as pd

    from app.seed import generate_records
    from app.services.forecast import HOLDOUT_DAYS as H, fit, predict_recursive, seasonal_naive

    model_maes, base_maes = [], []
    for offset in range(14):
        df = pd.DataFrame(generate_records(days=120, end=dt.date(2026, 10, 24) - dt.timedelta(days=offset)))
        s = df.groupby("date")["weight_kg"].sum()
        v, d = list(s.values), list(pd.to_datetime(s.index))
        tv, td, actual = v[:-H], d[:-H], np.array(v[-H:])
        model_maes.append(np.mean(np.abs(actual - np.array(predict_recursive(fit(tv, td), tv, td, H)))))
        base_maes.append(np.mean(np.abs(actual - np.array(seasonal_naive(tv, H)))))

    model, base = np.mean(model_maes), np.mean(base_maes)
    assert model < 0.95 * base, f"model MAE {model:.2f} should beat baseline {base:.2f} by at least 5%"
    assert sum(m < b for m, b in zip(model_maes, base_maes)) >= 10  # wins most datasets


# =========================================================================== insufficient data

def test_empty_database_is_insufficient_not_a_crash(empty_client):
    body = empty_client.get("/api/forecast").json()
    assert body == {
        "history": [],
        "forecast": [],
        "model": None,
        "metrics": {"mae": None, "baseline_mae": None, "holdout_days": None},
        "note": body["note"],
        "status": "insufficient_data",
    }
    assert body["note"].startswith(NOTE) and "at least 21 days" in body["note"] and "there are 0" in body["note"]


def test_ten_days_is_insufficient_with_history(client_with_days):
    body = client_with_days(10).get("/api/forecast").json()
    assert body["status"] == "insufficient_data" and body["forecast"] == [] and body["model"] is None
    assert len(body["history"]) == 10 and all(h["actual_kg"] > 0 for h in body["history"])
    assert "there are 10" in body["note"]


def test_twenty_days_is_still_insufficient(client_with_days):
    assert client_with_days(20).get("/api/forecast").json()["status"] == "insufficient_data"


def test_exactly_21_days_forecasts_with_a_shorter_holdout(client_with_days):
    body = client_with_days(21).get("/api/forecast").json()
    assert body["status"] == "ok" and len(body["forecast"]) == 7
    assert body["metrics"]["holdout_days"] == 7  # (21 − 7 warm-up days) / 2
    assert body["metrics"]["mae"] > 0 and body["metrics"]["baseline_mae"] > 0
    assert len(body["history"]) == 21
