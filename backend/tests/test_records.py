"""Endpoint tests for health, buildings and records CRUD (docs/API_CONTRACT.md)."""

import datetime as dt

import pytest

TODAY = dt.date.today()
TOMORROW = (TODAY + dt.timedelta(days=1)).isoformat()


def assert_error(res, status, field=None, contains=None):
    """Every error has a string `detail`; 422s also list per-field `errors`."""
    assert res.status_code == status, res.text
    body = res.json()
    assert isinstance(body["detail"], str) and body["detail"]
    if status == 422:
        assert isinstance(body["errors"], list) and body["errors"]
        if field:
            assert field in [e["field"] for e in body["errors"]], body
    if contains:
        assert contains.lower() in body["detail"].lower(), body["detail"]
    return body


# --------------------------------------------------------------------------- health / buildings

def test_health_reports_seeded_records(client):
    body = client.get("/api/health").json()
    assert body["status"] == "ok"
    assert body["records"] == body["record_count"] > 5000  # 120 days seeded


def test_buildings_lists_all_seven_with_types(client):
    res = client.get("/api/buildings")
    assert res.status_code == 200
    by_name = {b["building"]: b["building_type"] for b in res.json()}
    assert len(by_name) == 7
    assert by_name["Girls Hostel"] == "hostel"
    assert by_name["Library"] == "academic"


# --------------------------------------------------------------------------- list + pagination

def test_list_defaults_and_shape(client):
    body = client.get("/api/records").json()
    assert set(body) == {"items", "total", "page", "page_size"}
    assert body["page"] == 1 and body["page_size"] == 20 and len(body["items"]) == 20
    assert body["total"] == client.get("/api/health").json()["records"]
    item = body["items"][0]
    assert set(item) == {"id", "date", "building", "building_type", "category", "weight_kg", "disposal", "notes"}


def test_list_is_newest_first(client):
    items = client.get("/api/records", params={"page_size": 100}).json()["items"]
    keys = [(i["date"], i["id"]) for i in items]
    assert keys == sorted(keys, reverse=True)


def test_pagination_pages_do_not_overlap(client):
    p1 = client.get("/api/records", params={"page": 1, "page_size": 10}).json()
    p2 = client.get("/api/records", params={"page": 2, "page_size": 10}).json()
    assert len(p1["items"]) == len(p2["items"]) == 10
    assert not {i["id"] for i in p1["items"]} & {i["id"] for i in p2["items"]}


def test_page_beyond_end_is_empty_with_total(client):
    total = client.get("/api/records").json()["total"]
    body = client.get("/api/records", params={"page": 10_000, "page_size": 100}).json()
    assert body["items"] == [] and body["total"] == total


@pytest.mark.parametrize("params", [{"page": 0}, {"page_size": 0}, {"page_size": 101}, {"page": "abc"}])
def test_bad_pagination_is_422(client, params):
    field = next(iter(params))
    assert_error(client.get("/api/records", params=params), 422, field=field)


# --------------------------------------------------------------------------- filters

def test_filter_by_building(client):
    body = client.get("/api/records", params={"building": "Library", "page_size": 100}).json()
    assert body["items"] and all(i["building"] == "Library" for i in body["items"])
    assert all(i["building_type"] == "academic" for i in body["items"])
    assert body["total"] < client.get("/api/records").json()["total"]


def test_filter_by_category_totals_add_up(client):
    total = client.get("/api/records").json()["total"]
    per_category = [
        client.get("/api/records", params={"category": c}).json()["total"]
        for c in ("organic", "plastic", "paper", "metal", "other")
    ]
    assert sum(per_category) == total


def test_filter_by_date_range_is_inclusive(client):
    start, end = (TODAY - dt.timedelta(days=9)).isoformat(), (TODAY - dt.timedelta(days=7)).isoformat()
    # One building keeps 3 days of records on a single page, so both ends must appear.
    params = {"start_date": start, "end_date": end, "building": "Hostel A", "page_size": 100}
    body = client.get("/api/records", params=params).json()
    assert 0 < body["total"] <= 100
    dates = {i["date"] for i in body["items"]}
    assert dates == {start, (TODAY - dt.timedelta(days=8)).isoformat(), end}


def test_single_day_range(client):
    day = (TODAY - dt.timedelta(days=3)).isoformat()
    body = client.get("/api/records", params={"start_date": day, "end_date": day, "page_size": 100}).json()
    assert body["total"] > 0 and {i["date"] for i in body["items"]} == {day}


def test_combined_filters(client):
    params = {"building": "Hostel A", "category": "organic", "start_date": (TODAY - dt.timedelta(days=30)).isoformat()}
    items = client.get("/api/records", params={**params, "page_size": 100}).json()["items"]
    assert items and all(i["building"] == "Hostel A" and i["category"] == "organic" for i in items)


def test_empty_filter_values_are_ignored(client):
    total = client.get("/api/records").json()["total"]
    assert client.get("/api/records", params={"building": "", "category": "", "start_date": ""}).json()["total"] == total


def test_start_after_end_is_422(client):
    res = client.get("/api/records", params={"start_date": "2026-10-10", "end_date": "2026-10-01"})
    assert_error(res, 422, field="start_date", contains="start_date must be on or before end_date")


@pytest.mark.parametrize(
    "params,field",
    [
        ({"building": "Hostel Z"}, "building"),
        ({"category": "glass"}, "category"),
        ({"start_date": "2026-13-01"}, "start_date"),
        ({"end_date": "yesterday"}, "end_date"),
    ],
)
def test_invalid_filter_values_are_422(client, params, field):
    assert_error(client.get("/api/records", params=params), 422, field=field)


# --------------------------------------------------------------------------- create

def test_create_returns_201_and_derives_building_type(client, valid_body):
    body = {**valid_body, "building_type": "academic", "id": 999}  # both must be ignored
    res = client.post("/api/records", json=body)
    assert res.status_code == 201, res.text
    rec = res.json()
    assert rec["id"] != 999 and rec["building"] == "Hostel B" and rec["building_type"] == "hostel"
    assert rec["weight_kg"] == 18.5 and rec["notes"] == "PET bottles from the mess"
    assert client.get(f"/api/records/{rec['id']}").json() == rec
    client.delete(f"/api/records/{rec['id']}")


def test_create_normalises_weight_and_blank_notes(client, valid_body):
    rec = client.post("/api/records", json={**valid_body, "weight_kg": 12.3456, "notes": "   "}).json()
    assert rec["weight_kg"] == 12.35 and rec["notes"] is None
    client.delete(f"/api/records/{rec['id']}")


def test_create_increments_total_and_shows_first_for_today(client, valid_body):
    before = client.get("/api/records").json()["total"]
    rec = client.post("/api/records", json={**valid_body, "date": TODAY.isoformat()}).json()
    listing = client.get("/api/records").json()
    assert listing["total"] == before + 1
    assert listing["items"][0]["id"] == rec["id"]
    client.delete(f"/api/records/{rec['id']}")


def test_weight_boundary_5000_is_allowed(client, valid_body):
    res = client.post("/api/records", json={**valid_body, "weight_kg": 5000})
    assert res.status_code == 201
    client.delete(f"/api/records/{res.json()['id']}")


@pytest.mark.parametrize(
    "change,field,message",
    [
        ({"weight_kg": 0}, "weight_kg", "greater than 0"),
        ({"weight_kg": -3}, "weight_kg", "greater than 0"),
        ({"weight_kg": 5000.01}, "weight_kg", "less than or equal to 5000"),
        ({"weight_kg": "heavy"}, "weight_kg", "valid number"),
        ({"category": "glass"}, "category", "organic"),
        ({"disposal": "burned"}, "disposal", "landfill"),
        ({"building": "Hostel Z"}, "building", "Hostel A"),
        ({"date": TOMORROW}, "date", "cannot be in the future"),
        ({"date": "2026-02-30"}, "date", "date"),
        ({"notes": "x" * 501}, "notes", "at most 500"),
    ],
)
def test_create_rejects_invalid_fields(client, valid_body, change, field, message):
    before = client.get("/api/health").json()["records"]
    res = client.post("/api/records", json={**valid_body, **change})
    body = assert_error(res, 422, field=field, contains=message)
    assert body["detail"].startswith(f"{field}:")
    assert client.get("/api/health").json()["records"] == before  # nothing written


def test_create_missing_fields_lists_each_one(client):
    body = assert_error(client.post("/api/records", json={"notes": "only notes"}), 422)
    assert {e["field"] for e in body["errors"]} == {"date", "building", "category", "weight_kg", "disposal"}
    assert all(e["msg"] == "Field required" for e in body["errors"])


def test_create_with_malformed_json_is_422(client):
    res = client.post("/api/records", content=b'{"date": "2026-10-01",', headers={"Content-Type": "application/json"})
    assert_error(res, 422, contains="not valid JSON")


# --------------------------------------------------------------------------- read

def test_get_missing_record_is_404(client):
    body = assert_error(client.get("/api/records/987654"), 404)
    assert body == {"detail": "Record 987654 not found"}


@pytest.mark.parametrize("bad_id", ["abc", "0", "-5"])
def test_get_with_invalid_id_is_422(client, bad_id):
    assert_error(client.get(f"/api/records/{bad_id}"), 422, field="record_id")


# --------------------------------------------------------------------------- update

def test_put_replaces_record_and_rederives_type(client, created, valid_body):
    new = {**valid_body, "building": "Library", "category": "paper", "weight_kg": 7.25, "disposal": "landfill", "notes": None}
    res = client.put(f"/api/records/{created['id']}", json=new)
    assert res.status_code == 200, res.text
    rec = res.json()
    assert rec["id"] == created["id"]
    assert (rec["building"], rec["building_type"], rec["category"], rec["weight_kg"], rec["disposal"], rec["notes"]) == (
        "Library", "academic", "paper", 7.25, "landfill", None
    )
    assert client.get(f"/api/records/{created['id']}").json() == rec


def test_put_missing_record_is_404(client, valid_body):
    assert_error(client.put("/api/records/987654", json=valid_body), 404, contains="not found")


def test_put_invalid_body_is_422_and_leaves_record_unchanged(client, created, valid_body):
    assert_error(client.put(f"/api/records/{created['id']}", json={**valid_body, "weight_kg": 9999}), 422, field="weight_kg")
    assert client.get(f"/api/records/{created['id']}").json() == created


def test_put_partial_body_is_422(client, created):
    assert_error(client.put(f"/api/records/{created['id']}", json={"weight_kg": 3}), 422, field="date")


# --------------------------------------------------------------------------- delete

def test_delete_returns_204_then_404(client, created):
    before = client.get("/api/health").json()["records"]
    res = client.delete(f"/api/records/{created['id']}")
    assert res.status_code == 204 and res.content == b""
    assert client.get("/api/health").json()["records"] == before - 1
    assert_error(client.get(f"/api/records/{created['id']}"), 404)
    assert_error(client.delete(f"/api/records/{created['id']}"), 404)


# --------------------------------------------------------------------------- misc

def test_unknown_route_uses_same_error_shape(client):
    assert client.get("/api/nope").json() == {"detail": "Not Found"}


def test_cors_preflight_allows_frontend_origin(client):
    res = client.options(
        "/api/records",
        headers={"Origin": "http://localhost:5173", "Access-Control-Request-Method": "POST", "Access-Control-Request-Headers": "content-type"},
    )
    assert res.status_code == 200
    assert res.headers["access-control-allow-origin"] == "http://localhost:5173"


def test_cors_blocks_other_origins(client):
    res = client.get("/api/health", headers={"Origin": "http://evil.example"})
    assert "access-control-allow-origin" not in res.headers
