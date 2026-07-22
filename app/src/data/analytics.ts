import { format, subDays } from 'date-fns'
import { useData } from '@/lib/store'
import { useTickets } from '@/data/tickets'
import {
  type Priority,
  type Status,
  type Ticket,
  CLOSED_STATUSES,
  PRIORITY_LABEL,
  PRIORITY_OPTIONS,
  STATUS_LABEL,
  STATUS_OPTIONS,
  CATEGORY_LABEL,
  CATEGORY_OPTIONS,
  isOpenStatus,
  slaState,
} from '@/lib/itsm'

export interface DashboardKpis {
  open: number
  breached: number
  resolvedToday: number
  avgFirstResponseHours: number | null
}

function isToday(iso: string): boolean {
  const d = new Date(iso)
  const n = new Date()
  return d.toDateString() === n.toDateString()
}

export function useDashboardKpis(): DashboardKpis {
  const tickets = useTickets()
  const now = Date.now()
  const open = tickets.filter((t) => isOpenStatus(t.status)).length
  const breached = tickets.filter((t) => slaState(t, now) === 'breached').length
  const resolvedToday = tickets.filter(
    (t) => CLOSED_STATUSES.includes(t.status) && isToday(t.updatedAt),
  ).length
  const responded = tickets.filter((t) => t.firstResponseAt)
  const avgFirstResponseHours = responded.length
    ? responded.reduce(
        (sum, t) =>
          sum + (new Date(t.firstResponseAt as string).getTime() - new Date(t.createdAt).getTime()),
        0,
      ) /
      responded.length /
      (60 * 60 * 1000)
    : null
  return { open, breached, resolvedToday, avgFirstResponseHours }
}

export function useOpenByPriority(): { key: Priority; label: string; value: number }[] {
  const tickets = useTickets()
  return PRIORITY_OPTIONS.map((p) => ({
    key: p,
    label: PRIORITY_LABEL[p],
    value: tickets.filter((t) => isOpenStatus(t.status) && t.priority === p).length,
  }))
}

export function useByStatus(): { key: Status; label: string; value: number }[] {
  const tickets = useTickets()
  return STATUS_OPTIONS.map((s) => ({
    key: s,
    label: STATUS_LABEL[s],
    value: tickets.filter((t) => t.status === s).length,
  })).filter((d) => d.value > 0)
}

export interface VolumePoint {
  date: string
  created: number
  resolved: number
}

export function useVolumeSeries(days: number): VolumePoint[] {
  const tickets = useTickets()
  const points: VolumePoint[] = []
  for (let i = days - 1; i >= 0; i--) {
    const day = subDays(new Date(), i)
    const label = format(day, 'MMM d')
    const created = tickets.filter((t) => isSameDay(t.createdAt, day)).length
    const resolved = tickets.filter(
      (t) => CLOSED_STATUSES.includes(t.status) && isSameDay(t.updatedAt, day),
    ).length
    points.push({ date: label, created, resolved })
  }
  return points
}

function isSameDay(iso: string, day: Date): boolean {
  return new Date(iso).toDateString() === day.toDateString()
}

export function useAtRiskTickets(limit: number): Ticket[] {
  const tickets = useTickets()
  const now = Date.now()
  return tickets
    .filter((t) => {
      const st = slaState(t, now)
      return st === 'at_risk' || st === 'breached'
    })
    .sort((a, b) => a.slaDueAt.localeCompare(b.slaDueAt))
    .slice(0, limit)
}

// ---- Reports --------------------------------------------------------------

function withinRange(iso: string, days: number): boolean {
  return new Date(iso).getTime() >= Date.now() - days * 24 * 60 * 60 * 1000
}

export function useByCategory(days: number): { label: string; value: number }[] {
  const tickets = useTickets()
  return CATEGORY_OPTIONS.map((c) => ({
    label: CATEGORY_LABEL[c],
    value: tickets.filter((t) => t.category === c && withinRange(t.createdAt, days)).length,
  })).filter((d) => d.value > 0)
}

export interface ResolutionPoint {
  date: string
  hours: number
  compliance: number
}

export function useResolutionTrend(days: number): ResolutionPoint[] {
  const tickets = useTickets()
  const buckets = Math.min(days, 12)
  const step = Math.ceil(days / buckets)
  const points: ResolutionPoint[] = []
  for (let i = buckets - 1; i >= 0; i--) {
    const end = subDays(new Date(), i * step)
    const start = subDays(end, step)
    const resolved = tickets.filter(
      (t) =>
        CLOSED_STATUSES.includes(t.status) &&
        new Date(t.updatedAt) > start &&
        new Date(t.updatedAt) <= end,
    )
    const hours = resolved.length
      ? resolved.reduce(
          (sum, t) =>
            sum + (new Date(t.updatedAt).getTime() - new Date(t.createdAt).getTime()),
          0,
        ) /
        resolved.length /
        (60 * 60 * 1000)
      : 0
    const onTime = resolved.filter(
      (t) => new Date(t.updatedAt).getTime() <= new Date(t.slaDueAt).getTime(),
    ).length
    const compliance = resolved.length ? Math.round((onTime / resolved.length) * 100) : 0
    points.push({ date: format(end, 'MMM d'), hours: Math.round(hours * 10) / 10, compliance })
  }
  return points
}

export interface AgentStat {
  id: string
  name: string
  assigned: number
  resolved: number
  avgResolutionHours: number | null
}

export function useAgentLeaderboard(days: number): AgentStat[] {
  const tickets = useTickets()
  const people = useData((s) => s.people)
  const agents = people.filter((p) => p.role === 'agent')
  return agents.map((a) => {
    const mine = tickets.filter((t) => t.assigneeId === a.id && withinRange(t.createdAt, days))
    const resolvedTickets = mine.filter((t) => CLOSED_STATUSES.includes(t.status))
    const avg = resolvedTickets.length
      ? resolvedTickets.reduce(
          (s, t) => s + (new Date(t.updatedAt).getTime() - new Date(t.createdAt).getTime()),
          0,
        ) /
        resolvedTickets.length /
        (60 * 60 * 1000)
      : null
    return {
      id: a.id,
      name: a.name,
      assigned: mine.length,
      resolved: resolvedTickets.length,
      avgResolutionHours: avg === null ? null : Math.round(avg * 10) / 10,
    }
  })
}
