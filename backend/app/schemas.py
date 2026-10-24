"""Pydantic request/response schemas (docs/API_CONTRACT.md)."""

import datetime as dt
from typing import Annotated, Literal

from pydantic import BaseModel, BeforeValidator, ConfigDict, Field, computed_field, field_validator

from .constants import (
    BUILDINGS,
    MAX_NOTES_LENGTH,
    MAX_WEIGHT_KG,
    BuildingName,
    BuildingType,
    Category,
    Disposal,
)


def blank_to_none(v):
    """Treat '' (e.g. ?building=) as 'not provided'."""
    return None if isinstance(v, str) and not v.strip() else v


# Optional query-parameter types that ignore empty strings.
OptionalDate = Annotated[dt.date | None, BeforeValidator(blank_to_none)]
OptionalBuilding = Annotated[BuildingName | None, BeforeValidator(blank_to_none)]
OptionalCategory = Annotated[Category | None, BeforeValidator(blank_to_none)]


class ErrorItem(BaseModel):
    loc: list[str | int]
    field: str
    msg: str
    type: str


class ErrorOut(BaseModel):
    detail: str = Field(description="Human-readable summary")
    errors: list[ErrorItem] | None = Field(default=None, description="Per-field details (422 only)")


class HealthOut(BaseModel):
    status: Literal["ok"] = "ok"
    version: str
    records: int = Field(description="Number of waste records in the database")
    record_count: int = Field(description="Same as `records` (kept for the original contract)")


class BuildingOut(BaseModel):
    building: BuildingName
    building_type: BuildingType


class RecordInput(BaseModel):
    """Body for POST /records and PUT /records/{id}. building_type is derived, never sent."""

    model_config = ConfigDict(
        extra="ignore",  # a stray building_type / id from the client is ignored
        json_schema_extra={
            "example": {
                "date": "2026-10-20",
                "building": "Hostel B",
                "category": "plastic",
                "weight_kg": 18.5,
                "disposal": "recycled",
                "notes": "Mess plastic bottles",
            }
        },
    )

    date: dt.date
    building: BuildingName
    category: Category
    weight_kg: float = Field(gt=0, le=MAX_WEIGHT_KG, allow_inf_nan=False)
    disposal: Disposal
    notes: str | None = Field(default=None, max_length=MAX_NOTES_LENGTH)

    @field_validator("date")
    @classmethod
    def not_in_future(cls, v: dt.date) -> dt.date:
        if v > dt.date.today():
            raise ValueError("Date cannot be in the future")
        return v

    @field_validator("weight_kg")
    @classmethod
    def round_weight(cls, v: float) -> float:
        return round(v, 2)

    @field_validator("notes")
    @classmethod
    def strip_notes(cls, v: str | None) -> str | None:
        return (v.strip() or None) if v is not None else None

    @computed_field  # type: ignore[prop-decorator]
    @property
    def building_type(self) -> BuildingType:
        return BUILDINGS[self.building]  # type: ignore[return-value]


class RecordOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    date: dt.date
    building: BuildingName
    building_type: BuildingType
    category: Category
    weight_kg: float
    disposal: Disposal
    notes: str | None


class RecordPage(BaseModel):
    items: list[RecordOut]
    total: int
    page: int
    page_size: int


# --------------------------------------------------------------------------- stats (API_CONTRACT §5)

class SummaryOut(BaseModel):
    total_kg: float
    recycled_kg: float
    composted_kg: float
    landfill_kg: float
    recycling_rate: float = Field(description="(recycled + composted) / total × 100, 1 dp")
    record_count: int
    change_vs_prev_period: float | None = Field(
        description="% change in total_kg vs the previous window of equal length; null if that window has no data"
    )


class DailyPoint(BaseModel):
    date: dt.date
    total_kg: float
    recycled_kg: float = Field(description="recycled + composted")
    landfill_kg: float


class WeeklyPoint(BaseModel):
    week_start: dt.date = Field(description="Monday")
    total_kg: float
    recycled_kg: float = Field(description="recycled + composted")
    landfill_kg: float


class BuildingStat(BaseModel):
    building: BuildingName
    building_type: BuildingType
    total_kg: float
    recycled_kg: float = Field(description="recycled + composted")
    landfill_kg: float
    recycling_rate: float


class CategoryStat(BaseModel):
    category: Category
    total_kg: float
    percent: float


class TrendPoint(BaseModel):
    week_start: dt.date
    recycling_rate: float
    total_kg: float
    diverted_kg: float


class BuildingRef(BaseModel):
    building: BuildingName
    building_type: BuildingType
    recycling_rate: float


class RecyclingAnalytics(BaseModel):
    trend: list[TrendPoint]
    best_building: BuildingRef | None
    worst_building: BuildingRef | None
    insights: list[str]


# --------------------------------------------------------------------------- forecast

class HistoryPoint(BaseModel):
    date: dt.date
    actual_kg: float


class ForecastPoint(BaseModel):
    date: dt.date
    predicted_kg: float
    lower: float = Field(description="predicted − 1.5 × validation MAE, never below 0")
    upper: float = Field(description="predicted + 1.5 × validation MAE")


class ForecastMetrics(BaseModel):
    mae: float | None = Field(description="Model MAE (kg/day) on the held-out days, predicted recursively")
    baseline_mae: float | None = Field(description="MAE of the 'same day last week' naive forecast on the same days")
    holdout_days: int | None = Field(description="Number of held-out days the metrics were computed on")


class ForecastOut(BaseModel):
    history: list[HistoryPoint]
    forecast: list[ForecastPoint]
    model: str | None
    metrics: ForecastMetrics
    note: str
    status: Literal["ok", "insufficient_data"]
