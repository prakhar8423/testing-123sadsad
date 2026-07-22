import { useData } from '@/lib/store'
import { useUiStore } from '@/lib/ui-store'
import {
  type Ticket,
  type TimelineEvent,
  CURRENT_AGENT_ID,
  slaState,
} from '@/lib/itsm'

export function useTickets(): Ticket[] {
  return useData((s) => s.tickets)
}

export function useTicket(id: string | undefined): Ticket | undefined {
  const tickets = useTickets()
  return tickets.find((t) => t.id === id)
}

export function useTicketEvents(ticketId: string | undefined): TimelineEvent[] {
  const events = useData((s) => s.events)
  return events
    .filter((e) => e.ticketId === ticketId)
    .slice()
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
}

export function useRecentEvents(limit: number): TimelineEvent[] {
  const events = useData((s) => s.events)
  return events
    .slice()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit)
}

const SORT_KEYS = ['updatedAt', 'createdAt', 'priority', 'status', 'slaDueAt', 'subject'] as const
const PRIORITY_ORDER: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 }

// Derives the filtered + sorted queue from raw tickets and the UI filter state.
export function useFilteredTickets(): Ticket[] {
  const tickets = useTickets()
  const { search, scope, statusFilter, priorityFilter, categoryFilter, sortKey, sortDir } =
    useUiStore()

  const requesterName = useData((s) => s.people)
  const nameById = new Map(requesterName.map((p) => [p.id, p.name.toLowerCase()]))

  const now = Date.now()
  const q = search.trim().toLowerCase()

  let rows = tickets.filter((t) => {
    if (scope === 'mine' && t.assigneeId !== CURRENT_AGENT_ID) return false
    if (scope === 'unassigned' && t.assigneeId !== null) return false
    if (scope === 'at_risk') {
      const st = slaState(t, now)
      if (st !== 'at_risk' && st !== 'breached') return false
    }
    if (statusFilter !== 'all' && t.status !== statusFilter) return false
    if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false
    if (categoryFilter !== 'all' && t.category !== categoryFilter) return false
    if (q) {
      const rname = nameById.get(t.requesterId) ?? ''
      if (!t.subject.toLowerCase().includes(q) && !rname.includes(q) && !t.id.toLowerCase().includes(q))
        return false
    }
    return true
  })

  const key = (SORT_KEYS as readonly string[]).includes(sortKey) ? sortKey : 'updatedAt'
  const dir = sortDir === 'asc' ? 1 : -1
  rows = rows.slice().sort((a, b) => {
    if (key === 'priority') return (PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]) * dir
    const av = String(a[key as keyof Ticket] ?? '')
    const bv = String(b[key as keyof Ticket] ?? '')
    return av.localeCompare(bv) * dir
  })
  return rows
}
