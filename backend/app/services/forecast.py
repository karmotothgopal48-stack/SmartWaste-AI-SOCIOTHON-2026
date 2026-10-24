"""7-day forecast of total campus waste (kg/day) with scikit-learn.

Pipeline
1. Daily totals from the first to the latest record date, missing days filled with 0 (pandas).
2. Features for day t, using only days before t:
   day of week (one-hot), lag_1, lag_7, rolling 7-day mean, day index (trend), and the mean of the
   same weekday over the last 4 weeks. That last feature averages away day-to-day noise; without it
   the model lost to the naive baseline (see the docstring of `fit`).
3. RandomForestRegressor, forecasting day by day: each prediction becomes the lag input for the next.
4. Evaluation: hold out the last 14 days and forecast them recursively from the data before them,
   exactly like the real forecast. Compare with a "same day last week" naive forecast that also
   only sees data before the hold-out.
5. Refit on all days and forecast. Band = prediction ± 1.5 × validation MAE, floored at 0.
"""

from functools import lru_cache

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..models import WasteRecord

NOTE = "Forecasts are estimates, not guaranteed values."
MODEL_NAME = "random_forest"
MIN_DAYS = 21          # days with records needed before we forecast at all
HOLDOUT_DAYS = 14      # preferred evaluation window
WARMUP = 7             # the first week has no lag_7 / rolling mean
FULL_WARMUP = 28       # from day 28 the same-weekday mean covers a full 4 weeks
MIN_TRAIN_ROWS = 42    # use FULL_WARMUP only if that still leaves 6 weeks of training rows
HISTORY_DAYS = 30      # actuals returned for the chart
BAND_MULTIPLIER = 1.5
FEATURES = [f"dow_{i}" for i in range(7)] + ["lag_1", "lag_7", "roll_7", "day_index", "dow_mean_4w"]


# --------------------------------------------------------------------------- data

def daily_series(db: Session) -> pd.Series:
    """Total kg per day, first → latest record date, zero-filled. Empty Series when no data."""
    rows = db.execute(select(WasteRecord.date, func.sum(WasteRecord.weight_kg)).group_by(WasteRecord.date)).all()
    if not rows:
        return pd.Series(dtype="float64")
    s = pd.Series({pd.Timestamp(d): float(kg) for d, kg in rows}).sort_index()
    return s.reindex(pd.date_range(s.index.min(), s.index.max(), freq="D"), fill_value=0.0)


# --------------------------------------------------------------------------- features & model

def feature_row(values: list[float], dates: list[pd.Timestamp], t: int) -> list[float]:
    """Features for position t, built only from values[:t] (no leakage)."""
    dow = [0.0] * 7
    dow[dates[t].day_of_week] = 1.0
    window = values[t - 7 : t]
    # Same weekday over up to 4 past weeks (fewer early in short histories).
    same_dow = [values[t - 7 * k] for k in range(1, 5) if t - 7 * k >= 0]
    return dow + [values[t - 1], values[t - 7], float(np.mean(window)), float(t), float(np.mean(same_dow))]


def fit(values: list[float], dates: list[pd.Timestamp]) -> RandomForestRegressor:
    """Fit on every day after the warm-up week.

    Chosen by back-testing on 28 seeded datasets (14-day hold-out, recursive, vs "same day last week"):
    the original settings (min_samples_leaf=2, no dow_mean_4w) were ~4% WORSE than the baseline;
    larger leaves + max_features=0.6 + dow_mean_4w were ~16% better and won 24 of 28.
    """
    # With enough history, train only on days whose 4-week same-weekday mean is complete (less noisy).
    start = FULL_WARMUP if len(values) - FULL_WARMUP >= MIN_TRAIN_ROWS else WARMUP
    X = [feature_row(values, dates, t) for t in range(start, len(values))]
    y = values[start:]
    model = RandomForestRegressor(n_estimators=300, min_samples_leaf=8, max_features=0.6, random_state=42, n_jobs=1)
    model.fit(pd.DataFrame(X, columns=FEATURES), y)
    return model


def predict_recursive(model: RandomForestRegressor, values: list[float], dates: list[pd.Timestamp], horizon: int) -> list[float]:
    """Forecast `horizon` days after `values`, feeding each prediction back in as a lag."""
    values, dates = list(values), list(dates)
    out: list[float] = []
    for _ in range(horizon):
        dates.append(dates[-1] + pd.Timedelta(days=1))
        x = pd.DataFrame([feature_row(values, dates, len(values))], columns=FEATURES)
        pred = max(0.0, float(model.predict(x)[0]))
        values.append(pred)
        out.append(pred)
    return out


def seasonal_naive(values: list[float], horizon: int) -> list[float]:
    """'Same day last week', using only the data given: repeat the last observed week."""
    last_week = values[-7:]
    return [last_week[i % 7] for i in range(horizon)]


def holdout_size(n_days: int) -> int:
    """14 days when possible; with short histories, half the usable rows so training keeps the rest."""
    usable = n_days - WARMUP
    return min(HOLDOUT_DAYS, usable // 2)


# --------------------------------------------------------------------------- endpoint

def _r(x: float) -> float:
    return round(float(x), 2) + 0.0


def _history(series: pd.Series) -> list[dict]:
    return [{"date": d.date(), "actual_kg": _r(v)} for d, v in series.tail(HISTORY_DAYS).items()]


def forecast(db: Session, days: int = 7) -> dict:
    series = daily_series(db)
    # The daily series is the cache key: any add/edit/delete that changes a total refits the model.
    return _forecast_cached(days, tuple(series.index), tuple(series.values))


@lru_cache(maxsize=8)
def _forecast_cached(days: int, index: tuple, values: tuple) -> dict:
    series = pd.Series(values, index=pd.DatetimeIndex(index), dtype="float64")
    days_with_data = int((series > 0).sum())

    if days_with_data < MIN_DAYS:
        return {
            "history": _history(series),
            "forecast": [],
            "model": None,
            "metrics": {"mae": None, "baseline_mae": None, "holdout_days": None},
            "note": f"{NOTE} Not enough data to forecast yet: at least {MIN_DAYS} days of records are needed, "
            f"and there {'is' if days_with_data == 1 else 'are'} {days_with_data}.",
            "status": "insufficient_data",
        }

    vals, dates = list(series.values), list(series.index)

    # 1) Evaluate on the hold-out, forecasting it recursively from the days before it.
    h = holdout_size(len(vals))
    train_vals, train_dates, actual = vals[:-h], dates[:-h], np.array(vals[-h:])
    eval_model = fit(train_vals, train_dates)
    predicted = np.array(predict_recursive(eval_model, train_vals, train_dates, h))
    mae = float(np.mean(np.abs(actual - predicted)))
    baseline_mae = float(np.mean(np.abs(actual - np.array(seasonal_naive(train_vals, h)))))

    # 2) Refit on everything and forecast the future.
    model = fit(vals, dates)
    future = predict_recursive(model, vals, dates, days)
    band = BAND_MULTIPLIER * mae
    start = dates[-1] + pd.Timedelta(days=1)

    return {
        "history": _history(series),
        "forecast": [
            {
                "date": (start + pd.Timedelta(days=i)).date(),
                "predicted_kg": _r(p),
                "lower": _r(max(0.0, p - band)),
                "upper": _r(p + band),
            }
            for i, p in enumerate(future)
        ],
        "model": MODEL_NAME,
        "metrics": {"mae": _r(mae), "baseline_mae": _r(baseline_mae), "holdout_days": h},
        "note": f"{NOTE} Random forest on day-of-week, recent-lag, same-weekday and trend features, trained on {len(vals)} days. "
        f"The band is ±{BAND_MULTIPLIER} × the validation MAE ({_r(mae)} kg/day on the last {h} days).",
        "status": "ok",
    }
