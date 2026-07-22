import { formatDistanceToNowStrict } from 'date-fns'
import { Link } from 'react-router-dom'
import {
  CheckCircle2,
  MessageSquare,
  Plus,
  RefreshCcw,
  StickyNote,
  TriangleAlert,
  UserCog,
} from 'lucide-react'
import { usePersonMap, useRecentEvents } from '@/data'
import type { TimelineEvent, TimelineKind } from '@/lib/itsm'

const ICON: Record<TimelineKind, React.ComponentType<{ className?: string }>> = {
  created: Plus,
  status_changed: RefreshCcw,
  assigned: UserCog,
  priority_changed: RefreshCcw,
  comment: MessageSquare,
  internal_note: StickyNote,
  sla_breached: TriangleAlert,
  resolved: CheckCircle2,
}

const VERB: Record<TimelineKind, string> = {
  created: 'created',
  status_changed: 'changed status on',
  assigned: 'reassigned',
  priority_changed: 'changed priority on',
  comment: 'commented on',
  internal_note: 'noted on',
  sla_breached: 'SLA breached on',
  resolved: 'resolved',
}

export function ActivityRow({ event }: { event: TimelineEvent }) {
  const peopleMap = usePersonMap()
  const Icon = ICON[event.kind]
  const actor = peopleMap.get(event.actorId)?.name ?? 'System'
  const danger = event.kind === 'sla_breached'
  return (
    <li className="flex items-start gap-3 py-2.5">
      <span
        className={
          danger
            ? 'mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-[color-mix(in_srgb,var(--destructive),transparent_88%)] text-destructive'
            : 'mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground'
        }
      >
        <Icon className="size-3.5" />
      </span>
      <p className="text-sm leading-snug">
        <span className="font-medium">{actor}</span>{' '}
        <span className="text-muted-foreground">{VERB[event.kind]}</span>{' '}
        <Link to={`/tickets/${event.ticketId}`} className="font-medium text-accent hover:underline">
          {event.ticketId}
        </Link>
        <span className="ml-2 text-xs text-muted-foreground">
          {formatDistanceToNowStrict(new Date(event.createdAt), { addSuffix: true })}
        </span>
      </p>
    </li>
  )
}

export function ActivityFeed({ limit }: { limit: number }) {
  const events = useRecentEvents(limit)
  return (
    <ul className="divide-y divide-border">
      {events.map((e) => (
        <ActivityRow key={e.id} event={e} />
      ))}
    </ul>
  )
}
