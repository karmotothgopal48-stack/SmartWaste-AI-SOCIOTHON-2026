from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from ..database import get_db
from ..dependencies import record_filters
from ..schemas import (
    BuildingStat,
    CategoryStat,
    DailyPoint,
    ErrorOut,
    RecyclingAnalytics,
    SummaryOut,
    WeeklyPoint,
)
from ..services import stats as svc
from ..services.records import RecordFilters

router = APIRouter()
INVALID = {422: {"model": ErrorOut, "description": "Validation failed"}}


@router.get(
    "/stats/summary",
    response_model=SummaryOut,
    responses=INVALID,
    tags=["stats"],
    summary="KPI totals for a period (default: last 30 days of data)",
)
def summary(filters: RecordFilters = Depends(record_filters), db: Session = Depends(get_db)):
    return svc.summary(db, filters)


@router.get("/stats/daily", response_model=list[DailyPoint], responses=INVALID, tags=["stats"], summary="Daily totals, zero-filled")
def daily(
    days: int = Query(30, ge=1, le=svc.MAX_DAILY_DAYS, description="Window length; ignored when start_date is given"),
    filters: RecordFilters = Depends(record_filters),
    db: Session = Depends(get_db),
):
    return svc.daily(db, days, filters)


@router.get("/stats/weekly", response_model=list[WeeklyPoint], responses=INVALID, tags=["stats"], summary="Weekly totals (Monday start), zero-filled")
def weekly(
    weeks: int = Query(12, ge=1, le=104),
    filters: RecordFilters = Depends(record_filters),
    db: Session = Depends(get_db),
):
    return svc.weekly(db, weeks, filters)


@router.get("/stats/buildings", response_model=list[BuildingStat], responses=INVALID, tags=["stats"], summary="Per-building totals and recycling rate")
def buildings(filters: RecordFilters = Depends(record_filters), db: Session = Depends(get_db)):
    return svc.buildings(db, filters)


@router.get("/stats/categories", response_model=list[CategoryStat], responses=INVALID, tags=["stats"], summary="Weight and share per category")
def categories(filters: RecordFilters = Depends(record_filters), db: Session = Depends(get_db)):
    return svc.categories(db, filters)


@router.get(
    "/analytics/recycling",
    response_model=RecyclingAnalytics,
    responses=INVALID,
    tags=["analytics"],
    summary="Recycling trend, best/worst building and generated insights",
)
def recycling(filters: RecordFilters = Depends(record_filters), db: Session = Depends(get_db)):
    return svc.recycling_analytics(db, filters)
