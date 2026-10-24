"""Record queries and CRUD. Routers stay thin; data access lives here."""

import datetime as dt
from dataclasses import dataclass

from fastapi import HTTPException, status
from sqlalchemy import Select, func, select
from sqlalchemy.orm import Session

from ..models import WasteRecord
from ..schemas import RecordInput


@dataclass(frozen=True)
class RecordFilters:
    start_date: dt.date | None = None
    end_date: dt.date | None = None
    building: str | None = None
    category: str | None = None


def apply_filters(stmt: Select, f: RecordFilters) -> Select:
    """Add the common filters (API_CONTRACT §3) to any query over WasteRecord."""
    if f.start_date:
        stmt = stmt.where(WasteRecord.date >= f.start_date)
    if f.end_date:
        stmt = stmt.where(WasteRecord.date <= f.end_date)
    if f.building:
        stmt = stmt.where(WasteRecord.building == f.building)
    if f.category:
        stmt = stmt.where(WasteRecord.category == f.category)
    return stmt


def count_records(db: Session, f: RecordFilters | None = None) -> int:
    stmt = apply_filters(select(func.count()).select_from(WasteRecord), f or RecordFilters())
    return db.scalar(stmt) or 0


def list_records(db: Session, f: RecordFilters, page: int, page_size: int) -> tuple[list[WasteRecord], int]:
    total = count_records(db, f)
    stmt = (
        apply_filters(select(WasteRecord), f)
        .order_by(WasteRecord.date.desc(), WasteRecord.id.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    return list(db.scalars(stmt)), total


def get_record(db: Session, record_id: int) -> WasteRecord:
    record = db.get(WasteRecord, record_id)
    if record is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, f"Record {record_id} not found")
    return record


def create_record(db: Session, data: RecordInput) -> WasteRecord:
    record = WasteRecord(**data.model_dump())
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def update_record(db: Session, record_id: int, data: RecordInput) -> WasteRecord:
    record = get_record(db, record_id)
    for key, value in data.model_dump().items():  # full replacement (PUT)
        setattr(record, key, value)
    db.commit()
    db.refresh(record)
    return record


def delete_record(db: Session, record_id: int) -> None:
    record = get_record(db, record_id)
    db.delete(record)
    db.commit()
