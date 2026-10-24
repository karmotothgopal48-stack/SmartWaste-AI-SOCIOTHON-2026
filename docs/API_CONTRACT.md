# SmartWaste AI — API Contract

The single source of truth for data exchanged between the React frontend and the FastAPI backend. If code and this document disagree, update one so they match.

- **Base URL:** `http://localhost:8000/api` (the frontend calls `/api/...`, which Vite proxies to the backend)
- **Format:** JSON, UTF-8. Field names are `snake_case`.
- **Dates:** `YYYY-MM-DD` strings (ISO 8601 date, no time, campus-local).
- **Weights:** kilograms as floats, rounded to **2 decimal places** in responses.
- **Percentages:** `0–100` floats, rounded to **1 decimal place** (e.g. `62.4`, not `0.624`).
- **Auth:** none.
- **CORS:** allow `http://localhost:5173` and `http://127.0.0.1:5173`.

---

## 1. Enums & Constants

```ts
type BuildingType = "hostel" | "academic";
type Category     = "organic" | "plastic" | "paper" | "metal" | "other";
type Disposal     = "recycled" | "composted" | "landfill";
```

### Buildings (fixed list)
| building | building_type |
|---|---|
| `Hostel A` | `hostel` |
| `Hostel B` | `hostel` |
| `Girls Hostel` | `hostel` |
| `Academic Block 1` | `academic` |
| `Academic Block 2` | `academic` |
| `Library` | `academic` |
| `Admin Block` | `academic` |

`building_type` is **always derived on the server** from `building`. Clients may leave it out on create/update; if they send one that doesn't match, the server ignores it.

### Recycling rate (the one formula)
```
recycling_rate = (recycled_kg + composted_kg) / total_kg * 100
```
If `total_kg == 0`, then `recycling_rate = 0`.
**"Recycled" in KPI cards** means `recycled_kg + composted_kg` (diverted from landfill).

---

## 2. Record

```ts
interface WasteRecord {
  id: number;                 // server-assigned, read-only
  date: string;               // "YYYY-MM-DD"
  building: string;           // one of the 7 buildings
  building_type: BuildingType;// derived from building
  category: Category;
  weight_kg: number;          // float, > 0
  disposal: Disposal;
  notes: string | null;       // optional
}
```

### Example
```json
{
  "id": 42,
  "date": "2026-10-20",
  "building": "Hostel B",
  "building_type": "hostel",
  "category": "plastic",
  "weight_kg": 18.5,
  "disposal": "recycled",
  "notes": "Mess plastic bottles"
}
```

### Validation rules (enforced by server, mirrored on client)
| Field | Rule |
|---|---|
| `date` | Required, valid `YYYY-MM-DD`, not in the future |
| `building` | Required, exactly one of the 7 building names |
| `category` | Required, one of the `Category` enum |
| `weight_kg` | Required, number, `> 0` and `≤ 5000` |
| `disposal` | Required, one of the `Disposal` enum |
| `notes` | Optional, string, max 500 chars; an empty string becomes `null` |

### Create / update body (`RecordInput`)
```json
{
  "date": "2026-10-20",
  "building": "Hostel B",
  "category": "plastic",
  "weight_kg": 18.5,
  "disposal": "recycled",
  "notes": "Mess plastic bottles"
}
```
`PUT` is a full replacement: all required fields must be sent.

---

## 3. Common Query Filters

Used by `GET /records` and `GET /stats/summary`. They are also **accepted (optional)** by `/stats/daily`, `/stats/weekly`, `/stats/buildings`, `/stats/categories` and `/analytics/recycling`, so dashboard filters apply everywhere.

| Param | Type | Notes |
|---|---|---|
| `start_date` | `YYYY-MM-DD` | Inclusive |
| `end_date` | `YYYY-MM-DD` | Inclusive |
| `building` | string | Exact building name; omit for all |
| `category` | `Category` | Omit for all |

If `start_date > end_date`, the server returns `422`. An empty value (e.g. `?building=`) means the filter is not applied.

To get a summary over **all time** (the Records page summary strip), the client passes `start_date=1970-01-01` and leaves `end_date` empty.

---

## 4. Errors

Every error response has the same shape: `detail` is always a **human-readable string**.
```json
{ "detail": "Record 999 not found" }
```
Validation errors (`422`) also include an `errors` list with one item per problem field. `detail` joins them as `field: message; field: message`:
```json
{
  "detail": "weight_kg: Input should be greater than 0; date: Date cannot be in the future",
  "errors": [
    { "loc": ["body", "weight_kg"], "field": "weight_kg", "msg": "Input should be greater than 0", "type": "greater_than" },
    { "loc": ["body", "date"], "field": "date", "msg": "Date cannot be in the future", "type": "value_error" }
  ]
}
```
The frontend maps `errors[].field` to form fields for inline errors and shows `detail` in a toast otherwise. Malformed JSON returns `422` with `"Request body is not valid JSON"`. Unhandled server errors return `500` with `{"detail": "Internal server error"}` (the traceback is only logged).

| Status | When |
|---|---|
| `200` | OK |
| `201` | Record created |
| `204` | Record deleted (no body) |
| `404` | Record id not found |
| `422` | Validation failed (body or query) |
| `500` | Unexpected server error |

---

## 5. Endpoints

All paths are prefixed with `/api`.

### `GET /health`
```json
{ "status": "ok", "version": "1.0.0", "records": 6891, "record_count": 6891 }
```
`records` and `record_count` carry the same value. `record_count` is kept for backward compatibility.

---

### `GET /records`
Paginated list, newest first (`date DESC, id DESC`).

| Param | Default | Notes |
|---|---|---|
| `start_date`, `end_date`, `building`, `category` | — | See §3 |
| `page` | `1` | ≥ 1 |
| `page_size` | `20` | 1–100 |

**200**
```json
{
  "items": [ /* WasteRecord[] */ ],
  "total": 1260,
  "page": 1,
  "page_size": 20
}
```
A page beyond the end returns `items: []` with the correct `total`.

### `POST /records`
Body: `RecordInput` → **201** `WasteRecord`

### `GET /records/{id}`
**200** `WasteRecord` · **404** if missing

### `PUT /records/{id}`
Body: `RecordInput` → **200** updated `WasteRecord` · **404** · **422**

### `DELETE /records/{id}`
**204** no body · **404**

---

### `GET /buildings`
```json
[
  { "building": "Hostel A", "building_type": "hostel" },
  { "building": "Hostel B", "building_type": "hostel" },
  { "building": "Girls Hostel", "building_type": "hostel" },
  { "building": "Academic Block 1", "building_type": "academic" },
  { "building": "Academic Block 2", "building_type": "academic" },
  { "building": "Library", "building_type": "academic" },
  { "building": "Admin Block", "building_type": "academic" }
]
```

---

### `GET /stats/summary`
Filters: §3. If no date range is given, it covers **the last 30 days ending on the latest record date**.

```json
{
  "total_kg": 4821.35,
  "recycled_kg": 1890.2,
  "composted_kg": 1120.75,
  "landfill_kg": 1810.4,
  "recycling_rate": 62.4,
  "record_count": 418,
  "change_vs_prev_period": -6.3
}
```
- `change_vs_prev_period`: % change in `total_kg` against the previous window of equal length directly before `start_date` (same building/category filters). `(current - prev) / prev * 100`, 1 dp. **`null`** if the previous window has no data. Negative means less waste, which is good.

---

### `GET /stats/daily?days=30`
`days`: 1–365, default `30`. The window ends at `end_date` if given, otherwise at the latest record date. If `start_date` is given, it sets the window start and `days` is ignored. **Every day in the window is present**; days with no records have zeros.

```json
[
  { "date": "2026-10-19", "total_kg": 162.4, "recycled_kg": 98.1, "landfill_kg": 64.3 }
]
```
Sorted by `date` ascending. `recycled_kg` here = recycled + composted.

### `GET /stats/weekly?weeks=12`
`weeks`: 1–104, default `12`. Weeks start on **Monday**. Every week is present, with zeros if empty.

```json
[
  { "week_start": "2026-10-12", "total_kg": 1104.8, "recycled_kg": 690.2, "landfill_kg": 414.6 }
]
```
Sorted ascending. `recycled_kg` = recycled + composted.

### `GET /stats/buildings`
All 7 buildings are always returned (zeros if no data), sorted by `total_kg` descending.

```json
[
  {
    "building": "Hostel B",
    "building_type": "hostel",
    "total_kg": 980.5,
    "recycled_kg": 610.0,
    "landfill_kg": 370.5,
    "recycling_rate": 62.2
  }
]
```
`recycled_kg` = recycled + composted.

### `GET /stats/categories`
All 5 categories are always returned, sorted by `total_kg` descending. `percent` values add up to about 100 (rounding).

```json
[
  { "category": "organic", "total_kg": 2010.3, "percent": 41.7 },
  { "category": "plastic", "total_kg": 1102.0, "percent": 22.9 }
]
```

---

### `GET /analytics/recycling`
Filters: §3 (optional).

```json
{
  "trend": [
    { "week_start": "2026-09-28", "recycling_rate": 58.1, "total_kg": 1080.2, "diverted_kg": 627.6 },
    { "week_start": "2026-10-05", "recycling_rate": 61.0, "total_kg": 1112.9, "diverted_kg": 678.9 }
  ],
  "best_building":  { "building": "Library",  "building_type": "academic", "recycling_rate": 72.4 },
  "worst_building": { "building": "Hostel A", "building_type": "hostel",   "recycling_rate": 41.8 },
  "insights": [
    "Library recycles 72.4% of its waste, the highest on campus.",
    "Plastic from Hostel B rose 18% compared with last week.",
    "Campus diverted 3,010 kg from landfill in the last 30 days."
  ]
}
```
- `trend`: weekly (Monday start), last 12 weeks, ascending. `diverted_kg` = recycled + composted.
- `best_building` / `worst_building`: by `recycling_rate`, only among buildings with data; `null` if there is no data.
- `insights`: 3–6 short plain-English strings generated by rules from the data; `[]` if there is no data.

---

### `GET /forecast?days=7`
`days`: 1–14, default `7`. Forecasts **total campus waste per day**.

```json
{
  "history": [
    { "date": "2026-10-10", "actual_kg": 158.2 }
  ],
  "forecast": [
    { "date": "2026-10-25", "predicted_kg": 171.4, "lower": 148.9, "upper": 193.9 }
  ],
  "model": "random_forest",
  "metrics": { "mae": 10.02, "baseline_mae": 11.25, "holdout_days": 14 },
  "note": "Forecasts are estimates, not guaranteed values. Random forest on day-of-week, recent-lag, same-weekday and trend features, trained on 120 days. The band is ±1.5 × the validation MAE (10.02 kg/day on the last 14 days).",
  "status": "ok"
}
```

| Field | Meaning |
|---|---|
| `history` | Last **30 days** of actual daily totals, ascending, every day present (missing days = 0) |
| `forecast` | The next `days` days after the latest record date, ascending |
| `lower` / `upper` | `predicted_kg ± 1.5 × metrics.mae`, `lower` clamped to ≥ 0 |
| `model` | `"random_forest"` (scikit-learn `RandomForestRegressor`) |
| `metrics.mae` | Model MAE (kg/day) on the last `holdout_days` days, forecast **recursively** from the data before them (same as production) |
| `metrics.baseline_mae` | MAE of the "same day last week" naive forecast on the same days, also using only data before them |
| `metrics.holdout_days` | `14`; shorter (half the usable days) when history is short, e.g. `7` with exactly 21 days |
| `note` | **Always starts with** "Forecasts are estimates, not guaranteed values." The UI must show it with an "AI estimate" label |
| `status` | `"ok"` or `"insufficient_data"` |

**Features** (day *t*, from days before *t* only): day of week (one-hot), `lag_1`, `lag_7`, rolling 7-day mean, day index (trend), mean of the same weekday over the last 4 weeks. Back-tested on 28 seeded datasets: 16% lower MAE than the baseline, better on 24 of 28.

**Insufficient data** (fewer than **21 days** with records): `status: "insufficient_data"`, `forecast: []`, `model: null`, `metrics: { "mae": null, "baseline_mae": null, "holdout_days": null }`, and `note` says how many days are needed and how many exist. `history` still contains whatever exists (`[]` for an empty database).

---

## 6. Frontend Type Reference (copy into `src/lib/types.js` as JSDoc or into TS)

```ts
interface Paginated<T> { items: T[]; total: number; page: number; page_size: number; }
interface Summary { total_kg: number; recycled_kg: number; composted_kg: number; landfill_kg: number; recycling_rate: number; record_count: number; change_vs_prev_period: number | null; }
interface DailyPoint { date: string; total_kg: number; recycled_kg: number; landfill_kg: number; }
interface WeeklyPoint { week_start: string; total_kg: number; recycled_kg: number; landfill_kg: number; }
interface BuildingStat { building: string; building_type: BuildingType; total_kg: number; recycled_kg: number; landfill_kg: number; recycling_rate: number; }
interface CategoryStat { category: Category; total_kg: number; percent: number; }
interface BuildingRef { building: string; building_type: BuildingType; recycling_rate: number; }
interface RecyclingAnalytics { trend: { week_start: string; recycling_rate: number; total_kg: number; diverted_kg: number }[]; best_building: BuildingRef | null; worst_building: BuildingRef | null; insights: string[]; }
interface Forecast { history: { date: string; actual_kg: number }[]; forecast: { date: string; predicted_kg: number; lower: number; upper: number }[]; model: string | null; metrics: { mae: number | null; baseline_mae: number | null }; note: string; status: "ok" | "insufficient_data"; }
```
