import { useRef } from 'react'
import { Trash2 } from 'lucide-react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import { BuildingTypeBadge, CategoryChip, DisposalChip } from '../ui/Chips'
import { fmtLongDate, fmtNumber } from '../../lib/format'

export default function DeleteDialog({ record: current, deleting, onCancel, onConfirm }) {
  // Keep showing the last record while the dialog animates out.
  const last = useRef(current)
  if (current) last.current = current
  const record = last.current

  return (
    <Modal
      open={Boolean(current)}
      onClose={onCancel}
      dismissible={!deleting}
      tone="danger"
      icon={Trash2}
      maxWidth="max-w-md"
      title="Delete this record?"
      subtitle="This can't be undone. KPIs and charts will update."
      footer={
        <>
          <Button variant="secondary" onClick={onCancel} disabled={deleting} data-autofocus>Cancel</Button>
          <Button variant="danger-solid" icon={Trash2} loading={deleting} onClick={onConfirm}>Delete record</Button>
        </>
      }
    >
      {record && (
        <div className="rounded-xl border border-hair bg-surface-2/60 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-caption text-ink-muted">{fmtLongDate(record.date)}</div>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span className="text-body font-semibold text-ink">{record.building}</span>
                <BuildingTypeBadge type={record.building_type} />
              </div>
            </div>
            <div className="shrink-0 font-mono text-heading font-bold tabular-nums text-ink">
              {fmtNumber(record.weight_kg, 2)}<span className="ml-0.5 text-micro text-ink-faint">kg</span>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <CategoryChip category={record.category} />
            <DisposalChip disposal={record.disposal} />
          </div>
        </div>
      )}
    </Modal>
  )
}
