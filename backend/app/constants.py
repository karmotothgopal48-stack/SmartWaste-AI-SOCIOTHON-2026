"""Shared enums and limits. Mirrors docs/API_CONTRACT.md §1 and frontend/src/lib/constants.js."""

from typing import Literal

BUILDINGS: dict[str, str] = {
    "Hostel A": "hostel",
    "Hostel B": "hostel",
    "Girls Hostel": "hostel",
    "Academic Block 1": "academic",
    "Academic Block 2": "academic",
    "Library": "academic",
    "Admin Block": "academic",
}

CATEGORIES = ("organic", "plastic", "paper", "metal", "other")
DISPOSALS = ("recycled", "composted", "landfill")
BUILDING_TYPES = ("hostel", "academic")

BuildingName = Literal[
    "Hostel A", "Hostel B", "Girls Hostel", "Academic Block 1", "Academic Block 2", "Library", "Admin Block"
]
BuildingType = Literal["hostel", "academic"]
Category = Literal["organic", "plastic", "paper", "metal", "other"]
Disposal = Literal["recycled", "composted", "landfill"]

MAX_WEIGHT_KG = 5000
MAX_NOTES_LENGTH = 500
