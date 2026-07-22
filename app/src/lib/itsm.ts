// Domain types & constants for the Fieldpost service desk.

export type TicketType = 'incident' | 'request'

export type Category =
  | 'hardware'
  | 'software'
  | 'network'
  | 'access'
  | 'email'
  | 'other'

export type Priority = 'low' | 'medium' | 'high' | 'urgent'

export type Status =
  | 'new'
  | 'open'
  | 'in_progress'
  | 'on_hold'
  | 'resolved'
  | 'closed'

export type PersonRole = 'agent' | 'requester'

export type TimelineKind =
  | 'created'
  | 'status_changed'
  | 'assigned'
  | 'priority_changed'
  | 'comment'
  | 'internal_note'
  | 'sla_breached'
  | 'resolved'

export interface Person {
  id: string
  name: string
  email: string
  role: PersonRole
  team: string
  avatarHue: number
}

export interface Ticket {
  id: string
  type: TicketType
  subject: string
  description: string
  requesterId: string
  assigneeId: string | null
  category: Category
  priority: Priority
  status: Status
  createdAt: string
  updatedAt: string
  slaDueAt: string
  slaBreached: boolean
  firstResponseAt: string | null
  catalogItemId: string | null
  attachedArticleIds: string[]
}

export interface TimelineEvent {
  id: string
  ticketId: string
  kind: TimelineKind
  actorId: string
  body?: string
  meta?: { from?: string; to?: string; label?: string }
  createdAt: string
}

export interface CatalogItem {
  id: string
  title: string
  description: string
  category: Category
  icon: string
  fulfillmentDays: number
}

export interface Article {
  id: string
  title: string
  category: Category
  excerpt: string
  body: string[]
  updatedAt: string
  views: number
  helpfulYes: number
  helpfulNo: number
}

// ---- Labels ---------------------------------------------------------------

export const CATEGORY_LABEL: Record<Category, string> = {
  hardware: 'Hardware',
  software: 'Software',
  network: 'Network',
  access: 'Access',
  email: 'Email',
  other: 'Other',
}

export const PRIORITY_LABEL: Record<Priority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
}

export const STATUS_LABEL: Record<Status, string> = {
  new: 'New',
  open: 'Open',
  in_progress: 'In progress',
  on_hold: 'On hold',
  resolved: 'Resolved',
  closed: 'Closed',
}

export const CATEGORY_OPTIONS = Object.keys(CATEGORY_LABEL) as Category[]
export const PRIORITY_OPTIONS = Object.keys(PRIORITY_LABEL) as Priority[]
export const STATUS_OPTIONS = Object.keys(STATUS_LABEL) as Status[]

// ---- SLA ------------------------------------------------------------------

export const SLA_HOURS_BY_PRIORITY: Record<Priority, number> = {
  urgent: 4,
  high: 8,
  medium: 24,
  low: 72,
}

export const SLA_AT_RISK_HOURS = 4
export const HOUR_MS = 60 * 60 * 1000

export const OPEN_STATUSES: Status[] = ['new', 'open', 'in_progress', 'on_hold']
export const CLOSED_STATUSES: Status[] = ['resolved', 'closed']

export function isOpenStatus(status: Status): boolean {
  return OPEN_STATUSES.includes(status)
}

export function computeSlaDue(priority: Priority, fromIso: string): string {
  const base = new Date(fromIso).getTime()
  return new Date(base + SLA_HOURS_BY_PRIORITY[priority] * HOUR_MS).toISOString()
}

export type SlaState = 'resolved' | 'breached' | 'at_risk' | 'on_track'

export function slaState(ticket: Ticket, now: number = Date.now()): SlaState {
  if (!isOpenStatus(ticket.status)) return 'resolved'
  const due = new Date(ticket.slaDueAt).getTime()
  if (due <= now) return 'breached'
  if (due - now <= SLA_AT_RISK_HOURS * HOUR_MS) return 'at_risk'
  return 'on_track'
}

// ---- Semantic tone -> token classes ---------------------------------------
// tone drives which theme token colors a badge/dot; kept semantic, never raw.

export type Tone = 'neutral' | 'info' | 'warning' | 'success' | 'danger' | 'brand'

export const STATUS_TONE: Record<Status, Tone> = {
  new: 'info',
  open: 'warning',
  in_progress: 'warning',
  on_hold: 'neutral',
  resolved: 'success',
  closed: 'neutral',
}

export const PRIORITY_TONE: Record<Priority, Tone> = {
  low: 'neutral',
  medium: 'info',
  high: 'warning',
  urgent: 'danger',
}

export const SLA_TONE: Record<SlaState, Tone> = {
  on_track: 'success',
  at_risk: 'warning',
  breached: 'danger',
  resolved: 'neutral',
}

// The fixed "current agent" (no auth — internal single-user demo).
export const CURRENT_AGENT_ID = 'agent-1'
