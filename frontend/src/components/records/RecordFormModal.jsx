import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { ClipboardPlus, Mountain, Pencil, Recycle, Sprout } from 'lucide-react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import { Field, Select, inputClass } from '../ui/Field'
import { BuildingTypeBadge } from '../ui/Chips'
import { BUILDINGS, CATEGORIES, DISPOSALS, MAX_NOTES_LENGTH, MAX_WEIGHT_KG, buildingTypeOf } from '../../lib/constants'
import { categoryColors, disposalColors } from '../../lib/theme'
import { capitalize, todayISO } from '../../lib/format'
import { toRecordInput, validateRecord } from '../../lib/validation'
import { ApiError, getErrorMessage } from '../../services/api'

const EMPTY = { date: '', building: '', category: '', weight_kg: '', disposal: '', notes: '' }
const FIELD_ORDER = ['date', 'building', 'category', 'weight_kg', 'disposal', 'notes']
const DISPOSAL_ICONS = { recycled: Recycle, composted: Sprout, landfill: Mountain }

const initialValues = (record) =>
  record
    ? { ...EMPTY, ...record, weight_kg: String(record.weight_kg), notes: record.notes ?? '' }
    : { ...EMPTY, date: todayISO() }

/** Radio group rendered as coloured chips. */
function ChipRadioGroup({ name, options, value, onChange, colorOf, iconOf, error, labelledBy }) {
  return (
    <div role="radiogroup" aria-required="true" aria-labelledby={labelledBy} aria-invalid={Boolean(error) || undefined} className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const color = colorOf(opt)
        const Icon = iconOf?.(opt)
        const checked = value === opt
        return (
          <label key={opt} className="relative cursor-pointer">
            <input
              type="radio"
              name={name}
              value={opt}
              checked={checked}
              onChange={() => onChange(opt)}
              className="peer sr-only"
              id={opt === options[0] ? name : undefined}
            />
            <span
              className={`flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-small font-semibold transition peer-focus-visible:ring-2 peer-focus-visible:ring-primary/50 ${
                checked ? '' : `bg-surface-2 text-ink-muted hover:border-strong hover:text-ink ${error ? 'border-danger/50' : 'border-hair'}`
              }`}
              style={
                checked
                  ? {
                      color,
                      borderColor: `color-mix(in srgb, ${color} 55%, transparent)`,
                      background: `color-mix(in srgb, ${color} 14%, transparent)`,
                      boxShadow: `0 0 14px -4px color-mix(in srgb, ${color} 70%, transparent)`,
                    }
                  : undefined
              }
            >
              {Icon ? <Icon size={14} strokeWidth={2} /> : <span className="h-2 w-2 rounded-full" style={{ background: color }} />}
              {capitalize(opt)}
            </span>
          </label>
        )
      })}
    </div>
  )
}

export default function RecordFormModal({ open, record, onClose, onSubmit }) {
  const isEdit = Boolean(record)
  const [values, setValues] = useState(() => initialValues(record))
  const [touched, setTouched] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [serverErrors, setServerErrors] = useState({})
  const [saving, setSaving] = useState(false)

  // Reset whenever the modal opens for a (different) record.
  useEffect(() => {
    if (!open) return
    setValues(initialValues(record))
    setTouched({})
    setSubmitted(false)
    setServerErrors({})
    setSaving(false)
  }, [open, record])

  const clientErrors = validateRecord(values)
  const errorFor = (field) => serverErrors[field] || ((submitted || touched[field]) && clientErrors[field]) || null

  const set = (field) => (eOrValue) => {
    const value = eOrValue?.target ? eOrValue.target.value : eOrValue
    setValues((v) => ({ ...v, [field]: value }))
    setServerErrors((s) => ({ ...s, [field]: undefined }))
    // Chip groups have no blur; count a pick as touched.
    if (!eOrValue?.target) setTouched((t) => ({ ...t, [field]: true }))
  }
  const blur = (field) => () => setTouched((t) => ({ ...t, [field]: true }))

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitted(true)
    const firstInvalid = FIELD_ORDER.find((f) => clientErrors[f])
    if (firstInvalid) {
      document.getElementById(`rf-${firstInvalid}`)?.focus()
      return
    }
    setSaving(true)
    try {
      await onSubmit(toRecordInput(values))
    } catch (err) {
      if (err instanceof ApiError && err.status === 422 && Object.keys(err.fieldErrors).length) {
        setServerErrors(err.fieldErrors)
        toast.error('Please fix the highlighted fields')
      } else {
        toast.error(getErrorMessage(err))
      }
      setSaving(false)
    }
  }

  const describe = (field) => (errorFor(field) ? `rf-${field}-error` : undefined)
  const notesLength = values.notes.length

  return (
    <Modal
      open={open}
      onClose={onClose}
      dismissible={!saving}
      icon={isEdit ? Pencil : ClipboardPlus}
      title={isEdit ? 'Edit record' : 'Add waste record'}
      subtitle={isEdit ? `Record #${record.id}` : 'Log one bin weigh-in. Building type is set automatically.'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button type="submit" form="record-form" loading={saving}>
            {isEdit ? 'Save changes' : 'Add record'}
          </Button>
        </>
      }
    >
      <form id="record-form" onSubmit={handleSubmit} noValidate className="grid gap-4 sm:grid-cols-2">
        <Field label="Date" htmlFor="rf-date" error={errorFor('date')}>
          <input
            id="rf-date"
            required
            data-autofocus
            type="date"
            max={todayISO()}
            value={values.date}
            onChange={set('date')}
            onBlur={blur('date')}
            className={inputClass(errorFor('date'))}
            aria-invalid={Boolean(errorFor('date')) || undefined}
            aria-describedby={describe('date')}
          />
        </Field>

        <Field label="Building" htmlFor="rf-building" error={errorFor('building')}>
          <Select
            id="rf-building"
            required
            value={values.building}
            onChange={set('building')}
            onBlur={blur('building')}
            error={errorFor('building')}
            aria-invalid={Boolean(errorFor('building')) || undefined}
            aria-describedby={describe('building')}
          >
            <option value="" disabled>Select building…</option>
            <optgroup label="Hostels">
              {BUILDINGS.filter((b) => b.building_type === 'hostel').map((b) => <option key={b.building}>{b.building}</option>)}
            </optgroup>
            <optgroup label="Academic">
              {BUILDINGS.filter((b) => b.building_type === 'academic').map((b) => <option key={b.building}>{b.building}</option>)}
            </optgroup>
          </Select>
        </Field>

        <Field label={<span id="rf-category-label">Category</span>} error={errorFor('category')} htmlFor="rf-category" className="sm:col-span-2">
          <ChipRadioGroup
            name="rf-category"
            options={CATEGORIES}
            value={values.category}
            onChange={set('category')}
            colorOf={(c) => categoryColors[c]}
            error={errorFor('category')}
            labelledBy="rf-category-label"
          />
        </Field>

        <Field label="Weight" htmlFor="rf-weight_kg" error={errorFor('weight_kg')} hint={`Up to ${MAX_WEIGHT_KG.toLocaleString('en-US')} kg`}>
          <div className="relative">
            <input
              id="rf-weight_kg"
            required
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={values.weight_kg}
              onChange={set('weight_kg')}
              onBlur={blur('weight_kg')}
              className={`${inputClass(errorFor('weight_kg'))} pr-10 font-mono tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none`}
              aria-invalid={Boolean(errorFor('weight_kg')) || undefined}
              aria-describedby={describe('weight_kg')}
            />
            <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-caption font-semibold text-ink-faint">kg</span>
          </div>
        </Field>

        <div>
          <div className="mb-1.5 text-caption font-semibold text-ink-muted">Building type</div>
          <div className="flex h-10 items-center rounded-[10px] border border-dashed border-hair px-3 text-small text-ink-faint">
            {buildingTypeOf(values.building) ? <BuildingTypeBadge type={buildingTypeOf(values.building)} /> : 'Set from building'}
          </div>
        </div>

        <Field label={<span id="rf-disposal-label">Disposal</span>} error={errorFor('disposal')} htmlFor="rf-disposal" className="sm:col-span-2">
          <ChipRadioGroup
            name="rf-disposal"
            options={DISPOSALS}
            value={values.disposal}
            onChange={set('disposal')}
            colorOf={(d) => disposalColors[d]}
            iconOf={(d) => DISPOSAL_ICONS[d]}
            error={errorFor('disposal')}
            labelledBy="rf-disposal-label"
          />
        </Field>

        <Field label="Notes" optional htmlFor="rf-notes" error={errorFor('notes')} className="sm:col-span-2">
          <textarea
            id="rf-notes"
            rows={2}
            value={values.notes}
            onChange={set('notes')}
            onBlur={blur('notes')}
            placeholder="e.g. Mess kitchen waste after fest"
            className={`${inputClass(errorFor('notes'))} h-auto resize-none py-2.5`}
            aria-invalid={Boolean(errorFor('notes')) || undefined}
            aria-describedby={describe('notes')}
          />
          <div className={`mt-1 text-right font-mono text-micro ${notesLength > MAX_NOTES_LENGTH ? 'text-danger' : 'text-ink-faint'}`}>
            {notesLength}/{MAX_NOTES_LENGTH}
          </div>
        </Field>
      </form>
    </Modal>
  )
}
