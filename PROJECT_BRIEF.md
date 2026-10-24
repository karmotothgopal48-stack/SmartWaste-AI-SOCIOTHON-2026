# SmartWaste AI — Project Brief

**Event:** SOCIOTHON 2026 · **Theme:** Data-Driven Waste Monitoring
**One-liner:** A campus waste-monitoring command center that turns daily bin weigh-ins into live KPIs, building comparisons, recycling insights and a 7-day ML forecast.

---

## 1. Problem

Campuses generate tonnes of waste each week, but nobody can see where it comes from, how much is actually recycled, or what's coming next. Without data, waste reduction drives are guesswork. SmartWaste AI gives facilities staff and student sustainability teams one place to log waste, see the trends, and act on them.

## 2. Users

| User | Needs |
|---|---|
| Facilities / housekeeping staff | Log waste records quickly, fix mistakes |
| Sustainability committee | Compare buildings, track recycling %, spot problem areas |
| Campus administration | Headline KPIs, week-over-week change, a forecast for planning pickups |

## 3. Tech Stack

| Layer | Choice |
|---|---|
| Frontend | React + Vite, Tailwind CSS, Recharts, Framer Motion, lucide-react |
| Backend | FastAPI (Python), SQLAlchemy ORM, SQLite |
| Data / ML | Pandas, Scikit-learn |
| Constraints | No Docker, no paid APIs, no API keys. Must run locally on Windows. |

Default local ports: backend `http://localhost:8000`, frontend `http://localhost:5173` (Vite proxies `/api` to the backend).

## 4. Feature List

### 4.1 Dashboard KPI cards
- **Total waste** (kg) for the selected period
- **Recycled** (kg): recycled + composted
- **Landfill** (kg)
- **Recycling %** = (recycled + composted) / total × 100
- Each card shows the change against the previous period of the same length (▲/▼ with colour)
- Big numbers animate with a count-up

### 4.2 Waste charts
- **Daily chart:** last 30 days (configurable), stacked or multi-line total / recycled / landfill
- **Weekly chart:** last 12 weeks, bar chart of total vs recycled vs landfill
- Tooltips with exact values in kg

### 4.3 Building comparison
- Buildings: Hostel A, Hostel B, Girls Hostel, Academic Block 1, Academic Block 2, Library, Admin Block
- Each building is typed `hostel` or `academic`
- Ranked bar chart of total waste per building, coloured by type
- Hostels vs academic blocks summary (total, recycling %)
- Recycling rate per building

### 4.4 Records CRUD
- **Add** a record through a validated form (date, building, category, weight, disposal, optional notes)
- **View** a paginated, sortable table of records
- **Edit** a record in a modal or drawer
- **Delete** with a confirmation dialog
- Building type is derived from the building, never typed by the user

### 4.5 Waste categories
`organic`, `plastic`, `paper`, `metal`, `other`, each with a fixed colour (see `docs/DESIGN_SYSTEM.md`)
- Category breakdown donut chart with % share

### 4.6 Filters
- **Date range** (start, end, with presets: 7d / 30d / 90d / all)
- **Building** (all or one)
- **Category** (all or one)
- Filters apply to KPIs, charts and the records table, and are kept in the URL query string so views can be shared

### 4.7 7-day ML forecast
- Predicts total campus waste (kg/day) for the next 7 days
- Chart shows **historical actuals** (solid line) and **predicted values** (dashed line) with an uncertainty band (lower/upper)
- Clearly labelled **"Estimate"**, with a short note explaining how the forecast is made
- Shows an **evaluation metric**: MAE on a held-out period, compared with a naive baseline MAE, so the model has to earn its place
- Handles too little data: returns `status: "insufficient_data"` and the UI shows an explanatory empty state

### 4.8 Recycling & waste-reduction analytics
- Weekly recycling-rate trend line
- Best and worst performing building by recycling rate
- Auto-generated plain-English insights, e.g. *"Plastic from Hostel B rose 18% vs last week"*, *"Library recycles 72% of its waste, the highest on campus"*
- Landfill-diversion highlight (kg kept out of landfill)

### 4.9 UX quality
- **Loading states:** skeleton shimmer for cards, charts and tables
- **Empty states:** illustrated or icon messages with a call to action ("No records yet — add your first")
- **Validation:** inline field errors on the client; the server validates too and returns errors the UI can show
- **Toasts:** success (created / updated / deleted) and error (network or validation)
- **Fully responsive:** laptop (≥1280px) and mobile (≥360px); sidebar collapses to a bottom or hamburger nav on mobile; tables become card lists on small screens

## 5. Seed Data

The backend ships a seed script that generates about 90 days of realistic records for all 7 buildings:
- Hostels produce more organic waste; academic blocks produce more paper
- Weekday/weekend patterns (academic blocks drop on weekends)
- A mild upward trend and noise, so charts and the forecast look realistic

## 6. Out of Scope

Authentication, multi-campus support, IoT sensor ingestion, cloud deployment, and paid or third-party AI APIs.

## 7. Demo Script (target: 3 minutes)

1. Dashboard: KPIs count up, daily and weekly charts
2. Filter to "Hostel B" + "plastic", and everything updates
3. Add a record → success toast → KPIs refresh
4. Building comparison: hostels vs academic blocks
5. Forecast: next 7 days with the estimate label and the MAE vs baseline
6. Insights panel: what to act on this week

## 8. Reference Docs

- `docs/DESIGN_SYSTEM.md`: visual language, tokens, components, motion
- `docs/API_CONTRACT.md`: the shared data contract between frontend and backend
