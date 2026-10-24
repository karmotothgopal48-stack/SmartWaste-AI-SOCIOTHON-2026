import { Pencil, Trash2 } from 'lucide-react'
import { IconButton } from '../ui/Button'
import Skeleton from '../ui/Skeleton'
import { BuildingTypeBadge, CategoryChip, DisposalChip } from '../ui/Chips'
import { fmtLongDate, fmtNumber, fmtShortDate } from '../../lib/format'

const HIGHLIGHT = 'animate-[row-flash_2.4s_ease-out]'

function Actions({ record, onEdit, onDelete }) {
  return (
    <div className="flex items-center justify-end gap-0.5">
      <IconButton icon={Pencil} tone="primary" label={`Edit record ${record.id}`} onClick={() => onEdit(record)} />
      <IconButton icon={Trash2} tone="danger" label={`Delete record ${record.id}`} onClick={() => onDelete(record)} />
    </div>
  )
}

function SkeletonRows({ count }) {
  return Array.from({ length: count }, (_, i) => (
    <tr key={i} className="border-b border-hair last:border-0">
      <td className="px-5 py-4"><Skeleton className="h-4 w-24" /></td>
      <td className="px-3 py-4"><Skeleton className="h-4 w-32" /><Skeleton className="mt-1.5 h-3 w-16" /></td>
      <td className="px-3 py-4"><Skeleton className="h-5 w-20 rounded-full" /></td>
      <td className="px-3 py-4"><Skeleton className="ml-auto h-4 w-16" /></td>
      <td className="px-3 py-4"><Skeleton className="h-5 w-24 rounded-full" /></td>
      <td className="px-5 py-4"><Skeleton className="ml-auto h-7 w-16" /></td>
    </tr>
  ))
}

function SkeletonCards({ count }) {
  return Array.from({ length: count }, (_, i) => (
    <li key={i} className="space-y-3 p-4">
      <div className="flex justify-between"><Skeleton className="h-4 w-24" /><Skeleton className="h-5 w-16" /></div>
      <Skeleton className="h-4 w-40" />
      <div className="flex gap-2"><Skeleton className="h-5 w-20 rounded-full" /><Skeleton className="h-5 w-24 rounded-full" /></div>
    </li>
  ))
}

export default function RecordsTable({ items, loading, skeletonCount, highlightId, onEdit, onDelete }) {
  const showSkeleton = loading && !items
  const dim = loading && items ? 'opacity-50 transition-opacity' : 'transition-opacity'

  return (
    <>
      {/* Desktop / tablet table */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[680px] text-left">
          <caption className="sr-only">Waste records, newest first</caption>
          <thead>
            <tr className="border-b border-hair bg-surface-2/80 text-micro font-semibold tracking-[0.1em] text-ink-muted uppercase">
              <th scope="col" className="py-3 pr-2 pl-4 xl:pl-5">Date</th>
              <th scope="col" className="px-3 py-3">Building</th>
              <th scope="col" className="px-3 py-3">Category</th>
              <th scope="col" className="px-3 py-3 text-right">Weight</th>
              <th scope="col" className="px-3 py-3">Disposal</th>
              <th scope="col" className="py-3 pr-3 pl-2 text-right xl:pr-4"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody className={dim}>
            {showSkeleton ? (
              <SkeletonRows count={skeletonCount} />
            ) : (
              items.map((r) => (
                <tr
                  key={r.id}
                  className={`group border-b border-hair transition-colors last:border-0 hover:bg-surface-2/60 ${r.id === highlightId ? HIGHLIGHT : ''}`}
                >
                  <td className="py-3 pr-2 pl-4 whitespace-nowrap xl:pl-5">
                    <div className="text-small font-medium text-ink">{fmtShortDate(r.date)}</div>
                    <div className="font-mono text-micro text-ink-faint">{r.date.slice(0, 4)}</div>
                  </td>
                  <td className="max-w-[240px] px-3 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-small font-medium whitespace-nowrap text-ink">{r.building}</span>
                      <BuildingTypeBadge type={r.building_type} />
                    </div>
                    {r.notes && <div className="mt-0.5 truncate text-caption text-ink-faint" title={r.notes}>{r.notes}</div>}
                  </td>
                  <td className="px-3 py-3"><CategoryChip category={r.category} /></td>
                  <td className="px-3 py-3 text-right font-mono text-small font-medium whitespace-nowrap tabular-nums text-ink">
                    {fmtNumber(r.weight_kg, 2)} <span className="text-ink-faint">kg</span>
                  </td>
                  <td className="px-3 py-3"><DisposalChip disposal={r.disposal} /></td>
                  <td className="py-2 pr-3 pl-2 xl:pr-4">
                    <Actions record={r} onEdit={onEdit} onDelete={onDelete} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <ul className={`divide-y divide-hair md:hidden ${dim}`}>
        {showSkeleton ? (
          <SkeletonCards count={Math.min(skeletonCount, 5)} />
        ) : (
          items.map((r) => (
            <li key={r.id} className={`p-4 ${r.id === highlightId ? HIGHLIGHT : ''}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-caption text-ink-muted">{fmtLongDate(r.date)}</div>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <span className="text-body font-semibold text-ink">{r.building}</span>
                    <BuildingTypeBadge type={r.building_type} />
                  </div>
                </div>
                <div className="shrink-0 text-right font-mono text-heading font-bold tabular-nums text-ink">
                  {fmtNumber(r.weight_kg, 2)}
                  <span className="ml-0.5 text-micro font-medium text-ink-faint">kg</span>
                </div>
              </div>
              {r.notes && <p className="mt-2 text-caption text-ink-faint">{r.notes}</p>}
              <div className="mt-3 flex items-center justify-between gap-2">
                <div className="flex flex-wrap gap-1.5">
                  <CategoryChip category={r.category} />
                  <DisposalChip disposal={r.disposal} />
                </div>
                <Actions record={r} onEdit={onEdit} onDelete={onDelete} />
              </div>
            </li>
          ))
        )}
      </ul>
    </>
  )
}
