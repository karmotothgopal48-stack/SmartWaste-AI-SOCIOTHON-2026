from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .. import __version__
from ..database import get_db
from ..schemas import HealthOut
from ..services.records import count_records

router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthOut, summary="Service health and record count")
def health(db: Session = Depends(get_db)) -> HealthOut:
    count = count_records(db)
    return HealthOut(version=__version__, records=count, record_count=count)
