from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from ..database import get_db
from ..schemas import ErrorOut, ForecastOut
from ..services import forecast as svc

router = APIRouter(tags=["forecast"])


@router.get(
    "/forecast",
    response_model=ForecastOut,
    responses={422: {"model": ErrorOut, "description": "Validation failed"}},
    summary="ML forecast of total daily waste (estimate)",
)
def get_forecast(days: int = Query(7, ge=1, le=14, description="Days to forecast"), db: Session = Depends(get_db)):
    return svc.forecast(db, days)
