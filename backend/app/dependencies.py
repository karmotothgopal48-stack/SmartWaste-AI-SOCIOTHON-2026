"""Shared query-parameter dependencies."""

from typing import Annotated

from fastapi import Query
from fastapi.exceptions import RequestValidationError

from .errors import validation_error
from .schemas import OptionalBuilding, OptionalCategory, OptionalDate
from .services.records import RecordFilters


def record_filters(
    # Query() lives inside Annotated so the blank-to-None BeforeValidator in each type is applied.
    start_date: Annotated[OptionalDate, Query(description="Inclusive, YYYY-MM-DD")] = None,
    end_date: Annotated[OptionalDate, Query(description="Inclusive, YYYY-MM-DD")] = None,
    building: Annotated[OptionalBuilding, Query(description="Exact building name; omit for all")] = None,
    category: Annotated[OptionalCategory, Query(description="Omit for all")] = None,
) -> RecordFilters:
    """The common filters from API_CONTRACT §3, with the cross-field date check."""
    if start_date and end_date and start_date > end_date:
        raise RequestValidationError([validation_error("start_date", "start_date must be on or before end_date")])
    return RecordFilters(start_date=start_date, end_date=end_date, building=building, category=category)
