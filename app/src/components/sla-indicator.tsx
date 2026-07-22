import { formatDistanceToNowStrict } from 'date-fns'
import { AlertTriangle, CheckCircle2, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ToneBadge } from '@/components/tone-badge'
import { type Ticket, SLA_TONE, slaState } from '@/lib/itsm'

const LABEL = {
  on_track: 'On track',
  at_risk: 'At risk',
  breached: 'Breached',
  resolved: 'Met',
} as const

// Compact SLA cell for the queue: relative due time with breach emphasis.
export function SlaCell({ ticket }: { ticket: Ticket }) {
  const state = slaState(ticket)
  if (state === 'resolved') {
    return <span className="text-xs text-muted-foreground">—</span>
  }
  const due = new Date(ticket.slaDueAt)
  const rel = formatDistanceToNowStrict(due, { addSuffix: true })
  return (
    <span
      className={cn(
        'text-xs tabular-nums',
        state === 'breached' && 'font-semibold text-destructive',
        state === 'at_risk' && 'font-medium text-[color:var(--chart-3)]',
        state === 'on_track' && 'text-muted-foreground',
      )}
    >
      {state === 'breached' ? `overdue ${rel.replace(' ago', '')}` : rel}
    </span>
  )
}

// Prominent SLA clock for the detail header.
export function SlaClock({ ticket }: { ticket: Ticket }) {
  const state = slaState(ticket)
  const Icon = state === 'breached' ? AlertTriangle : state === 'resolved' ? CheckCircle2 : Clock
  const due = new Date(ticket.slaDueAt)
  const rel = formatDistanceToNowStrict(due, { addSuffix: true })
  const detail =
    state === 'resolved'
      ? 'Clock stopped'
      : state === 'breached'
        ? `Overdue by ${rel.replace(' ago', '')}`
        : `Due ${rel}`
  return (
    <div className="flex items-center gap-2">
      <Icon
        className={cn(
          'size-4',
          state === 'breached' ? 'text-destructive' : 'text-muted-foreground',
        )}
        aria-hidden
      />
      <div className="flex flex-col">
        <ToneBadge tone={SLA_TONE[state]}>{LABEL[state]}</ToneBadge>
      </div>
      <span className="text-sm text-muted-foreground">{detail}</span>
    </div>
  )
}
