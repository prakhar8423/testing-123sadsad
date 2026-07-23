import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { type QueueScope, useUiStore } from '@/lib/ui-store'
import {
  CATEGORY_LABEL,
  CATEGORY_OPTIONS,
  PRIORITY_LABEL,
  PRIORITY_OPTIONS,
  STATUS_LABEL,
  STATUS_OPTIONS,
} from '@/lib/itsm'

const SCOPES: { key: QueueScope; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'mine', label: 'My tickets' },
  { key: 'unassigned', label: 'Unassigned' },
  { key: 'at_risk', label: 'SLA' },
]

export function QueueFilters() {
  const {
    search,
    scope,
    statusFilter,
    priorityFilter,
    categoryFilter,
    setSearch,
    setScope,
    setStatusFilter,
    setPriorityFilter,
    setCategoryFilter,
    clearFilters,
  } = useUiStore()

  const hasFilters =
    search !== '' ||
    scope !== 'all' ||
    statusFilter !== 'all' ||
    priorityFilter !== 'all' ||
    categoryFilter !== 'all'

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-1 rounded-md bg-muted p-1">
        {SCOPES.map((s) => (
          <button
            key={s.key}
            type="button"
            onClick={() => setScope(s.key)}
            className={cn(
              'rounded-sm px-3 py-1.5 text-sm font-medium transition-colors',
              scope === s.key
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-52 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search subject, requester, ID…"
            className="pl-9"
            aria-label="Filter tickets"
          />
        </div>

        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as never)}>
          <SelectTrigger className="w-36" aria-label="Filter by status">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s} value={s}>
                {STATUS_LABEL[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={priorityFilter} onValueChange={(v) => setPriorityFilter(v as never)}>
          <SelectTrigger className="w-36" aria-label="Filter by priority">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All priorities</SelectItem>
            {PRIORITY_OPTIONS.map((p) => (
              <SelectItem key={p} value={p}>
                {PRIORITY_LABEL[p]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v as never)}>
          <SelectTrigger className="w-36" aria-label="Filter by category">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {CATEGORY_OPTIONS.map((c) => (
              <SelectItem key={c} value={c}>
                {CATEGORY_LABEL[c]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="size-4" /> Clear
          </Button>
        )}
      </div>
    </div>
  )
}
