import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { CalendarX2, Plus } from 'lucide-react'
import { useRecords } from '../hooks/useRecords'
import { createRecord, deleteRecord, updateRecord } from '../services/api'
import { notifyError } from '../lib/notify'
import { fadeUp, staggerContainer } from '../components/ui/Card'
import Button from '../components/ui/Button'
import FilterBar from '../components/records/FilterBar'
import SummaryStrip from '../components/records/SummaryStrip'
import RecordsTable from '../components/records/RecordsTable'
import Pagination from '../components/records/Pagination'
import EmptyState from '../components/records/EmptyState'
import { ErrorCard } from '../components/ui/StatusCards'
import RecordFormModal from '../components/records/RecordFormModal'
import DeleteDialog from '../components/records/DeleteDialog'
import { capitalize, fmtNumber } from '../lib/format'

const PAGE_SIZE = 10

function Message({ icon: Icon, title, text, action }) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-warning/30 bg-warning/10 text-warning">
        <Icon size={20} strokeWidth={1.75} />
      </div>
      <h3 className="font-display text-title font-semibold text-ink">{title}</h3>
      <p className="mt-1 max-w-sm text-small text-ink-muted">{text}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export default function Records() {
  const r = useRecords({ pageSize: PAGE_SIZE })
  const [form, setForm] = useState({ open: false, record: null })
  const [toDelete, setToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [highlightId, setHighlightId] = useState(null)
  const flashTimer = useRef()

  const flash = (id) => {
    clearTimeout(flashTimer.current)
    setHighlightId(id)
    flashTimer.current = setTimeout(() => setHighlightId(null), 2600)
  }

  const openCreate = () => setForm({ open: true, record: null })
  const openEdit = (record) => setForm({ open: true, record })
  const closeForm = () => setForm((f) => ({ ...f, open: false }))

  // Errors are thrown back to the modal, which shows them inline / as a toast.
  async function handleSave(input) {
    const label = `${fmtNumber(input.weight_kg, 2)} kg of ${input.category} · ${input.building}`
    if (form.record) {
      const saved = await updateRecord(form.record.id, input)
      toast.success(`Record updated: ${label}`)
      flash(saved.id)
    } else {
      const saved = await createRecord(input)
      toast.success(`Record added: ${label}`)
      flash(saved.id)
      if (r.page !== 1) r.setPage(1)
    }
    closeForm()
    r.refresh()
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      await deleteRecord(toDelete.id)
      toast.success(`Deleted ${capitalize(toDelete.category)} record from ${toDelete.building}`)
      setToDelete(null)
      r.refresh()
    } catch (err) {
      notifyError(err)
    } finally {
      setDeleting(false)
    }
  }

  const items = r.list?.items
  const isEmpty = r.list && r.list.total === 0 && !r.loading

  let body
  if (r.rangeInvalid) {
    body = (
      <Message
        icon={CalendarX2}
        title="Check the date range"
        text="The “From” date is after the “To” date."
        action={<Button variant="secondary" onClick={r.reset}>Reset filters</Button>}
      />
    )
  } else if (r.error && !r.list) {
    body = <ErrorCard error={r.error} onRetry={r.refresh} title="Couldn't load records" className="border-0 bg-none shadow-none" />
  } else if (isEmpty) {
    body = <EmptyState filtered={r.hasFilters} onReset={r.reset} onAdd={openCreate} />
  } else {
    body = (
      <>
        <RecordsTable
          items={items}
          loading={r.loading}
          skeletonCount={PAGE_SIZE}
          highlightId={highlightId}
          onEdit={openEdit}
          onDelete={setToDelete}
        />
        {r.list && <Pagination page={r.page} pageSize={PAGE_SIZE} total={r.list.total} onPage={r.setPage} />}
      </>
    )
  }

  return (
    <>
      <motion.div variants={staggerContainer} initial="hidden" animate="show" className="grid gap-4 lg:gap-6">
        <FilterBar
          filters={r.filters}
          onChange={r.setFilter}
          onReset={r.reset}
          hasFilters={r.hasFilters}
          rangeInvalid={r.rangeInvalid}
        />

        <motion.div variants={fadeUp} className="flex flex-col gap-3 xl:flex-row xl:items-stretch">
          <SummaryStrip summary={r.rangeInvalid ? null : r.summary} loading={r.loading} failed={Boolean(r.error && !r.summary)} />
          <Button icon={Plus} onClick={openCreate} className="md:self-end xl:h-auto xl:self-auto xl:px-5">
            Add record
          </Button>
        </motion.div>

        <motion.section variants={fadeUp} className="glass overflow-hidden" aria-busy={r.loading}>
          {body}
        </motion.section>
      </motion.div>

      <RecordFormModal open={form.open} record={form.record} onClose={closeForm} onSubmit={handleSave} />
      <DeleteDialog record={toDelete} deleting={deleting} onCancel={() => setToDelete(null)} onConfirm={handleDelete} />
    </>
  )
}
