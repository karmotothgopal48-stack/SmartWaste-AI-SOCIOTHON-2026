// Shared enums — mirror docs/API_CONTRACT.md §1.
export const BUILDINGS = [
  { building: 'Hostel A', building_type: 'hostel' },
  { building: 'Hostel B', building_type: 'hostel' },
  { building: 'Girls Hostel', building_type: 'hostel' },
  { building: 'Academic Block 1', building_type: 'academic' },
  { building: 'Academic Block 2', building_type: 'academic' },
  { building: 'Library', building_type: 'academic' },
  { building: 'Admin Block', building_type: 'academic' },
]

export const BUILDING_NAMES = BUILDINGS.map((b) => b.building)

export const buildingTypeOf = (name) =>
  BUILDINGS.find((b) => b.building === name)?.building_type ?? null

export const CATEGORIES = ['organic', 'plastic', 'paper', 'metal', 'other']

export const DISPOSALS = ['recycled', 'composted', 'landfill']

export const MAX_WEIGHT_KG = 5000
export const MAX_NOTES_LENGTH = 500
