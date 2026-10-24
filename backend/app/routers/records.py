from fastapi import APIRouter, Depends, Path, Query, Response, status
from sqlalchemy.orm import Session

from ..constants import BUILDINGS
from ..database import get_db
from ..dependencies import record_filters
from ..schemas import BuildingOut, ErrorOut, RecordInput, RecordOut, RecordPage
from ..services import records as svc
from ..services.records import RecordFilters

router = APIRouter(tags=["records"])

NOT_FOUND = {404: {"model": ErrorOut, "description": "Record not found"}}
INVALID = {422: {"model": ErrorOut, "description": "Validation failed"}}
RecordId = Path(ge=1, description="Record id")


@router.get("/records", response_model=RecordPage, responses=INVALID, summary="List records (newest first)")
def list_records(
    filters: RecordFilters = Depends(record_filters),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
) -> RecordPage:
    items, total = svc.list_records(db, filters, page, page_size)
    return RecordPage(items=items, total=total, page=page, page_size=page_size)


@router.post("/records", response_model=RecordOut, status_code=status.HTTP_201_CREATED, responses=INVALID, summary="Create a record")
def create_record(data: RecordInput, db: Session = Depends(get_db)):
    return svc.create_record(db, data)


@router.get("/records/{record_id}", response_model=RecordOut, responses={**NOT_FOUND, **INVALID}, summary="Get one record")
def get_record(record_id: int = RecordId, db: Session = Depends(get_db)):
    return svc.get_record(db, record_id)


@router.put("/records/{record_id}", response_model=RecordOut, responses={**NOT_FOUND, **INVALID}, summary="Replace a record")
def update_record(data: RecordInput, record_id: int = RecordId, db: Session = Depends(get_db)):
    return svc.update_record(db, record_id, data)


@router.delete(
    "/records/{record_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    response_class=Response,
    responses={**NOT_FOUND, **INVALID},
    summary="Delete a record",
)
def delete_record(record_id: int = RecordId, db: Session = Depends(get_db)) -> Response:
    svc.delete_record(db, record_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/buildings", response_model=list[BuildingOut], tags=["buildings"], summary="The 7 campus buildings")
def list_buildings() -> list[BuildingOut]:
    return [BuildingOut(building=name, building_type=btype) for name, btype in BUILDINGS.items()]
