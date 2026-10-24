import { BedDouble, Mountain, Recycle, School, Sprout } from 'lucide-react'
import { buildingTypeColors, categoryColors, disposalColors } from '../../lib/theme'
import { capitalize } from '../../lib/format'

const tint = (color, pct) => `color-mix(in srgb, ${color} ${pct}%, transparent)`

function Pill({ color, children, className = '' }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-caption font-semibold whitespace-nowrap ${className}`}
      style={{ color, background: tint(color, 12), borderColor: tint(color, 25) }}
    >
      {children}
    </span>
  )
}

export function CategoryChip({ category }) {
  const color = categoryColors[category]
  return (
    <Pill color={color}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} aria-hidden="true" />
      {capitalize(category)}
    </Pill>
  )
}

const DISPOSAL_ICONS = { recycled: Recycle, composted: Sprout, landfill: Mountain }

export function DisposalChip({ disposal }) {
  const Icon = DISPOSAL_ICONS[disposal]
  return (
    <Pill color={disposalColors[disposal]}>
      <Icon size={12} strokeWidth={2} aria-hidden="true" />
      {capitalize(disposal)}
    </Pill>
  )
}

export function BuildingTypeBadge({ type }) {
  const Icon = type === 'hostel' ? BedDouble : School
  const color = buildingTypeColors[type]
  return (
    <span
      className="inline-flex items-center gap-1 rounded-md px-1.5 py-px text-micro font-semibold tracking-wide uppercase"
      style={{ color, background: tint(color, 10) }}
    >
      <Icon size={11} strokeWidth={2} aria-hidden="true" />
      {type === 'hostel' ? 'Hostel' : 'Academic'}
    </span>
  )
}
