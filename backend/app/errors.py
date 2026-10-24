"""One JSON error shape for every failure: {"detail": "<readable message>"}.

422s also include "errors": [{loc, field, msg, type}] so the frontend can show messages
next to the right form field (docs/API_CONTRACT.md §4).
"""

import logging

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

logger = logging.getLogger("uvicorn.error")

_LOCATIONS = {"body", "query", "path", "header", "cookie"}


def _field(loc) -> str:
    parts = [str(p) for p in loc if p not in _LOCATIONS]
    return ".".join(parts) or (str(loc[0]) if loc else "request")


def _message(err: dict) -> str:
    msg = err.get("msg", "Invalid value")
    if err.get("type") == "json_invalid":
        return "Request body is not valid JSON"
    return msg.removeprefix("Value error, ")


def validation_error(field: str, msg: str, location: str = "query") -> dict:
    """Build an error item in pydantic's shape, for raising RequestValidationError by hand."""
    return {"type": "value_error", "loc": (location, field), "msg": msg, "input": None}


def register_error_handlers(app: FastAPI) -> None:
    @app.exception_handler(RequestValidationError)
    async def _validation(_request: Request, exc: RequestValidationError) -> JSONResponse:
        errors = [
            {"loc": list(e.get("loc", ())), "field": _field(e.get("loc", ())), "msg": _message(e), "type": e.get("type", "value_error")}
            for e in exc.errors()
        ]
        detail = "; ".join(f"{e['field']}: {e['msg']}" for e in errors) or "Invalid request"
        return JSONResponse(status_code=422, content={"detail": detail, "errors": errors})

    @app.exception_handler(StarletteHTTPException)
    async def _http(_request: Request, exc: StarletteHTTPException) -> JSONResponse:
        detail = exc.detail if isinstance(exc.detail, str) else str(exc.detail)
        return JSONResponse(status_code=exc.status_code, content={"detail": detail}, headers=getattr(exc, "headers", None))

    @app.exception_handler(Exception)
    async def _unhandled(request: Request, exc: Exception) -> JSONResponse:
        logger.exception("Unhandled error on %s %s", request.method, request.url.path)
        return JSONResponse(status_code=500, content={"detail": "Internal server error"})
