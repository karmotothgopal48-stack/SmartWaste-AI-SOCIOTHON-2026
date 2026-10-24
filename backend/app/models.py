"""ORM models. WasteRecord matches the Record shape in docs/API_CONTRACT.md §2."""

import datetime as dt

from sqlalchemy import CheckConstraint, Date, DateTime, Float, Index, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from .constants import BUILDING_TYPES, CATEGORIES, DISPOSALS, MAX_NOTES_LENGTH, MAX_WEIGHT_KG
from .database import Base


def _in(column: str, values: tuple[str, ...]) -> str:
    return f"{column} IN ({', '.join(repr(v) for v in values)})"


class WasteRecord(Base):
    __tablename__ = "waste_records"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    date: Mapped[dt.date] = mapped_column(Date, nullable=False, index=True)
    building: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    building_type: Mapped[str] = mapped_column(String(16), nullable=False)
    category: Mapped[str] = mapped_column(String(16), nullable=False, index=True)
    weight_kg: Mapped[float] = mapped_column(Float, nullable=False)
    disposal: Mapped[str] = mapped_column(String(16), nullable=False)
    notes: Mapped[str | None] = mapped_column(String(MAX_NOTES_LENGTH), nullable=True)
    created_at: Mapped[dt.datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)

    # Last line of defence; the API validates first (app/schemas.py).
    __table_args__ = (
        CheckConstraint(f"weight_kg > 0 AND weight_kg <= {MAX_WEIGHT_KG}", name="ck_weight_range"),
        CheckConstraint(_in("building_type", BUILDING_TYPES), name="ck_building_type"),
        CheckConstraint(_in("category", CATEGORIES), name="ck_category"),
        CheckConstraint(_in("disposal", DISPOSALS), name="ck_disposal"),
        Index("ix_records_date_id", "date", "id"),  # newest-first listing
    )

    def __repr__(self) -> str:
        return f"<WasteRecord {self.id} {self.date} {self.building} {self.category} {self.weight_kg}kg {self.disposal}>"
