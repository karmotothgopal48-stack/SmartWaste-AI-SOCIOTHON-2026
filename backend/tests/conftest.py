"""Test setup: every test session gets its own throwaway SQLite file, seeded like production.

SMARTWASTE_DB_PATH must be set before `app` is imported, because app.database reads it at import.
"""

import os
import shutil
import tempfile
from pathlib import Path

_TMP_DIR = tempfile.mkdtemp(prefix="smartwaste-test-")
os.environ["SMARTWASTE_DB_PATH"] = str(Path(_TMP_DIR) / "test.db")

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from app.database import DB_PATH, engine  # noqa: E402
from app.main import app  # noqa: E402


@pytest.fixture(scope="session")
def client():
    # Guard: never run tests against the real database.
    assert Path(_TMP_DIR) in DB_PATH.parents, f"Refusing to test against {DB_PATH}"
    with TestClient(app) as c:  # `with` runs the lifespan: create tables + seed
        yield c
    engine.dispose()  # release the file handle so Windows can delete it
    shutil.rmtree(_TMP_DIR, ignore_errors=True)


@pytest.fixture
def client_with_days(client):
    """Factory: the same app backed by a fresh database seeded with `days` days of data (0 = empty)."""
    from sqlalchemy import create_engine, insert
    from sqlalchemy.orm import sessionmaker

    from app.database import Base, get_db
    from app.models import WasteRecord
    from app.seed import generate_records

    engines = []

    def make(days: int):
        eng = create_engine(f"sqlite:///{Path(_TMP_DIR) / f'days_{days}.db'}", connect_args={"check_same_thread": False})
        engines.append(eng)
        Base.metadata.drop_all(eng)
        Base.metadata.create_all(eng)
        if days:
            with eng.begin() as conn:
                conn.execute(insert(WasteRecord), generate_records(days=days))
        Session = sessionmaker(bind=eng)

        def override():
            with Session() as db:
                yield db

        app.dependency_overrides[get_db] = override
        return client

    try:
        yield make
    finally:
        app.dependency_overrides.pop(get_db, None)
        for eng in engines:
            eng.dispose()


@pytest.fixture
def empty_client(client_with_days):
    """The same app, but every request uses a brand-new, empty database."""
    return client_with_days(0)


@pytest.fixture
def valid_body():
    return {
        "date": "2026-10-01",
        "building": "Hostel B",
        "category": "plastic",
        "weight_kg": 18.5,
        "disposal": "recycled",
        "notes": "PET bottles from the mess",
    }


@pytest.fixture
def created(client, valid_body):
    """A fresh record, deleted afterwards if the test didn't delete it."""
    record = client.post("/api/records", json=valid_body).json()
    yield record
    client.delete(f"/api/records/{record['id']}")
