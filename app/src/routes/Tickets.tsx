import { useNavigate } from 'react-router-dom'
import { ArrowDown, ArrowUp, ChevronsUpDown, Inbox, SearchX } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { PageHeader, EmptyState } from '@/components/page-header'
import { QueueFilters } from '@/components/queue-filters'
import { BulkActionBar } from '@/components/bulk-action-bar'
import { PriorityBadge, StatusBadge } from '@/components/tone-badge'
import { SlaCell } from '@/components/sla-indicator'
import { PersonAvatar } from '@/components/person-avatar'
import { useUiStore } from '@/lib/ui-store'
import { useFilteredTickets, usePersonMap, useTickets } from '@/data'
import { CATEGORY_LABEL } from '@/lib/itsm'

const COLUMNS: { key: string; label: string; sortable: boolean; className?: string }[] = [
  { key: 'id', label: 'ID', sortable: false, className: 'w-24' },
  { key: 'subject', label: 'Subject', sortable: true },
  { key: 'priority', label: 'Priority', sortable: true, className: 'w-28' },
  { key: 'status', label: 'Status', sortable: true, className: 'w-32' },
  { key: 'category', label: 'Category', sortable: false, className: 'w-28' },
  { key: 'assigneeId', label: 'Assignee', sortable: false, className: 'w-40' },
  { key: 'slaDueAt', label: 'SLA', sortable: true, className: 'w-32' },
]

function SortHead({ col }: { col: (typeof COLUMNS)[number] }) {
  const { sortKey, sortDir, setSort } = useUiStore()
  if (!col.sortable) return <span>{col.label}</span>
  const active = sortKey === col.key
  const Icon = !active ? ChevronsUpDown : sortDir === 'asc' ? ArrowUp : ArrowDown
  return (
    <button
      type="button"
      onClick={() => setSort(col.key)}
      className={cn(
        'inline-flex items-center gap-1 transition-colors hover:text-foreground',
        active ? 'text-foreground' : 'text-muted-foreground',
      )}
    >
      {col.label}
      <Icon className="size-3.5" />
    </button>
  )
}

export default function Tickets() {
  const navigate = useNavigate()
  const allTickets = useTickets()
  const rows = useFilteredTickets()
  const peopleMap = usePersonMap()
  const { selectedIds, toggleSelected, setSelected, clearFilters } = useUiStore()

  const allSelected = rows.length > 0 && rows.every((t) => selectedIds.includes(t.id))
  const someSelected = selectedIds.length > 0 && !allSelected

  function toggleAll() {
    setSelected(allSelected ? [] : rows.map((t) => t.id))
  }

  if (allTickets.length === 0) {
    return (
      <>
        <PageHeader title="Tickets" description="The service-desk queue." />
        <EmptyState
          icon={Inbox}
          title="Your queue is clear"
          description="There are no tickets yet. New incidents and service requests will appear here."
        />
      </>
    )
  }

  return (
    <>
      <PageHeader
        title="Tickets"
        description={`${rows.length} of ${allTickets.length} ticket${allTickets.length > 1 ? 's' : ''} shown.`}
      />

      <div className="mb-4">
        <QueueFilters />
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title="No tickets match these filters"
          description="Try broadening your search or clearing the active filters."
          action={
            <Button variant="outline" onClick={clearFilters}>
              Clear filters
            </Button>
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-md border border-border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="w-10">
                  <Checkbox
                    checked={allSelected ? true : someSelected ? 'indeterminate' : false}
                    onCheckedChange={toggleAll}
                    aria-label="Select all tickets"
                  />
                </TableHead>
                {COLUMNS.map((col) => (
                  <TableHead key={col.key} className={cn('text-xs', col.className)}>
                    <SortHead col={col} />
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((t) => {
                const assignee = t.assigneeId ? peopleMap.get(t.assigneeId) : undefined
                const selected = selectedIds.includes(t.id)
                return (
                  <TableRow
                    key={t.id}
                    data-state={selected ? 'selected' : undefined}
                    className="cursor-pointer"
                    onClick={() => navigate(`/tickets/${t.id}`)}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selected}
                        onCheckedChange={() => toggleSelected(t.id)}
                        aria-label={`Select ${t.id}`}
                      />
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{t.id}</TableCell>
                    <TableCell className="max-w-xs">
                      <span className="block truncate font-medium">{t.subject}</span>
                      <span className="text-xs text-muted-foreground">
                        {peopleMap.get(t.requesterId)?.name}
                      </span>
                    </TableCell>
                    <TableCell>
                      <PriorityBadge priority={t.priority} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={t.status} />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {CATEGORY_LABEL[t.category]}
                    </TableCell>
                    <TableCell>
                      {assignee ? (
                        <span className="flex items-center gap-2">
                          <PersonAvatar person={assignee} size="sm" />
                          <span className="truncate text-sm">{assignee.name}</span>
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <SlaCell ticket={t} />
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <BulkActionBar />
    </>
  )
}
