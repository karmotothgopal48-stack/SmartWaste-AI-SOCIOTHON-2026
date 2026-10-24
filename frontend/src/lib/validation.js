import { BUILDING_NAMES, CATEGORIES, DISPOSALS, MAX_NOTES_LENGTH, MAX_WEIGHT_KG } from './constants'
import { todayISO } from './format'

/** Client-side mirror of the server rules in docs/API_CONTRACT.md. Returns { field: message }. */
export function validateRecord(values) {
  const errors = {}

  if (!values.date) errors.date = 'Date is required'
  else if (!/^\d{4}-\d{2}-\d{2}$/.test(values.date)) errors.date = 'Enter a valid date'
  else if (values.date > todayISO()) errors.date = 'Date cannot be in the future'

  if (!values.building) errors.building = 'Choose a building'
  else if (!BUILDING_NAMES.includes(values.building)) errors.building = 'Unknown building'

  if (!values.category) errors.category = 'Choose a category'
  else if (!CATEGORIES.includes(values.category)) errors.category = 'Unknown category'

  const raw = String(values.weight_kg ?? '').trim()
  const weight = Number(raw)
  if (raw === '') errors.weight_kg = 'Weight is required'
  else if (!Number.isFinite(weight)) errors.weight_kg = 'Enter a number'
  else if (weight <= 0) errors.weight_kg = 'Weight must be greater than 0'
  else if (weight > MAX_WEIGHT_KG) errors.weight_kg = `Weight can be at most ${MAX_WEIGHT_KG.toLocaleString('en-US')} kg`

  if (!values.disposal) errors.disposal = 'Choose a disposal method'
  else if (!DISPOSALS.includes(values.disposal)) errors.disposal = 'Unknown disposal method'

  if ((values.notes ?? '').length > MAX_NOTES_LENGTH) errors.notes = `Notes can be at most ${MAX_NOTES_LENGTH} characters`

  return errors
}

/** Form values → API RecordInput. */
export function toRecordInput(values) {
  return {
    date: values.date,
    building: values.building,
    category: values.category,
    weight_kg: Math.round(Number(values.weight_kg) * 100) / 100,
    disposal: values.disposal,
    notes: values.notes?.trim() || null,
  }
}
