import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { CalendarDays, RotateCcw, SlidersHorizontal } from 'lucide-react'
import { motion } from 'framer-motion'
import { Field, Select, inputClass } from '../ui/Field'
import Button from '../ui/Button'
import { fadeUp } from '../ui/Card'
import { BUILDINGS, CATEGORIES } from '../../lib/constants'
import { capitalize, todayISO } from '../../lib/format'

export default function FilterBar({ filters, onChange, onReset, hasFilters, rangeInvalid }) {
  const today = todayISO()
  const { state } = useLocation()
  const startRef = useRef(null)

  // Arriving from the top-bar filter shortcut: put the cursor in the first filter.
  useEffect(() => {
    if (state?.focusFilters) startRef.current?.focus()
  }, [state?.focusFilters])

  return (
    <motion.section variants={fadeUp} className="glass p-5 sm:p-6" aria-label="Filters">
      <div className="mb-3 flex items-center gap-2 text-ink-muted">
        <SlidersHorizontal size={15} strokeWidth={1.75} />
        <span className="label-caps text-micro">Filters</span>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-[1fr_1fr_1.3fr_1fr_auto] lg:items-start">
        <Field label="From" htmlFor="f-start">
          <div className="relative">
            <input
              id="f-start"
              ref={startRef}
              type="date"
              value={filters.start_date}
              max={filters.end_date || today}
              onChange={(e) => onChange('start_date', e.target.value)}
              className={inputClass(rangeInvalid)}
              aria-invalid={rangeInvalid || undefined}
            />
          </div>
        </Field>
        <Field label="To" htmlFor="f-end" error={rangeInvalid ? 'Must be on or after “From”' : null}>
          <input
            id="f-end"
            type="date"
            value={filters.end_date}
            min={filters.start_date || undefined}
            max={today}
            onChange={(e) => onChange('end_date', e.target.value)}
            className={inputClass(rangeInvalid)}
            aria-invalid={rangeInvalid || undefined}
            aria-describedby={rangeInvalid ? 'f-end-error' : undefined}
          />
        </Field>
        <Field label="Building" htmlFor="f-building">
          <Select id="f-building" value={filters.building} onChange={(e) => onChange('building', e.target.value)}>
            <option value="">All buildings</option>
            <optgroup label="Hostels">
              {BUILDINGS.filter((b) => b.building_type === 'hostel').map((b) => (
                <option key={b.building} value={b.building}>{b.building}</option>
              ))}
            </optgroup>
            <optgroup label="Academic">
              {BUILDINGS.filter((b) => b.building_type === 'academic').map((b) => (
                <option key={b.building} value={b.building}>{b.building}</option>
              ))}
            </optgroup>
          </Select>
        </Field>
        <Field label="Category" htmlFor="f-category">
          <Select id="f-category" value={filters.category} onChange={(e) => onChange('category', e.target.value)}>
            <option value="">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{capitalize(c)}</option>
            ))}
          </Select>
        </Field>
        <div className="col-span-2 flex items-end lg:col-span-1 lg:h-full lg:pt-[22px]">
          <Button variant="secondary" icon={RotateCcw} onClick={onReset} disabled={!hasFilters} className="w-full lg:w-auto">
            Reset
          </Button>
        </div>
      </div>
      {!hasFilters && (
        <p className="mt-3 flex items-center gap-1.5 text-caption text-ink-faint">
          <CalendarDays size={12} strokeWidth={1.75} /> Showing all records, newest first.
        </p>
      )}
    </motion.section>
  )
}
