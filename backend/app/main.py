"""SmartWaste AI API. Run from the backend folder:  uvicorn app.main:app --reload --port 8000"""

import logging
import threading
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse

from . import __version__
from .database import DB_PATH, Base, SessionLocal, engine
from .errors import register_error_handlers
from .routers import forecast, health, records, stats
from .seed import record_count, seed_if_empty
from .services import forecast as forecast_service

logger = logging.getLogger("uvicorn.error")

ALLOWED_ORIGINS = ["http://localhost:5173", "http://127.0.0.1:5173"]


@asynccontextmanager
async def lifespan(_app: FastAPI):
    Base.metadata.create_all(engine)
    with SessionLocal() as db:
        inserted = seed_if_empty(db)
        total = record_count(db)
    if inserted:
        logger.info("Seeded %d demo records into %s", inserted, DB_PATH)
    else:
        logger.info("Database already has %d records; skipping seed (%s)", total, DB_PATH)
    # Train the default 7-day forecast in the background so the first page view is instant.
    threading.Thread(target=_warm_forecast, name="forecast-warmup", daemon=True).start()
    yield


def _warm_forecast() -> None:
    try:
        with SessionLocal() as db:
            forecast_service.forecast(db, 7)
        logger.info("Forecast model warmed up")
    except Exception:  # never block or crash startup over a warm-up
        logger.exception("Forecast warm-up failed")


app = FastAPI(
    title="SmartWaste AI API",
    version=__version__,
    description="Campus waste monitoring: records, stats, analytics and a 7-day forecast. "
    "Contract: docs/API_CONTRACT.md.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type"],
)

register_error_handlers(app)

app.include_router(health.router, prefix="/api")
app.include_router(records.router, prefix="/api")
app.include_router(stats.router, prefix="/api")
app.include_router(forecast.router, prefix="/api")


@app.get("/", include_in_schema=False)
def root() -> RedirectResponse:
    return RedirectResponse("/docs")
