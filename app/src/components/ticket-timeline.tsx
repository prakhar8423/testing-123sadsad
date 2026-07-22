import { format } from 'date-fns'
import {
  CheckCircle2,
  MessageSquare,
  Plus,
  RefreshCcw,
  StickyNote,
  TriangleAlert,
  UserCog,
} from 'lucide-react'
import { PersonAvatar } from '@/components/person-avatar'
import { usePersonMap } from '@/data'
import {
  type TimelineEvent,
  type TimelineKind,
  PRIORITY_LABEL,
  STATUS_LABEL,
} from '@/lib/itsm'

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

function metaLabel(kind: TimelineKind, value: string, peopleMap: Map<string, { name: string }>) {
  if (kind === 'assigned') return value === 'unassigned' ? 'Unassigned' : (peopleMap.get(value)?.name ?? value)
  if (kind === 'status_changed') return STATUS_LABEL[value as never] ?? value
  if (kind === 'priority_changed') return PRIORITY_LABEL[value as never] ?? value
  return value
}

function systemText(event: TimelineEvent, peopleMap: Map<string, { name: string }>): string {
  const to = event.meta?.to ? metaLabel(event.kind, event.meta.to, peopleMap) : ''
  switch (event.kind) {
    case 'created':
      return 'created the ticket'
    case 'assigned':
      return `assigned to ${to}`
    case 'status_changed':
      return `moved to ${to}`
    case 'priority_changed':
      return `set priority to ${to}`
    case 'sla_breached':
      return 'SLA breached'
    case 'resolved':
      return 'marked resolved'
    default:
      return ''
  }
}

export function TicketTimeline({ events }: { events: TimelineEvent[] }) {
  const peopleMap = usePersonMap()
  if (events.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">No activity yet.</p>
  }

  return (
    <ol className="space-y-4">
      {events.map((event) => {
        const actor = peopleMap.get(event.actorId)
        const isMessage = event.kind === 'comment' || event.kind === 'internal_note'
        const Icon = ICON[event.kind]
        const danger = event.kind === 'sla_breached'
        const time = format(new Date(event.createdAt), 'MMM d, h:mm a')

        if (isMessage) {
          const internal = event.kind === 'internal_note'
          return (
            <li key={event.id} className="flex gap-3">
              <PersonAvatar person={actor} size="md" className="mt-0.5" />
              <div
                className={
                  internal
                    ? 'flex-1 rounded-md border border-[color-mix(in_srgb,var(--chart-3),transparent_60%)] bg-[color-mix(in_srgb,var(--chart-3),transparent_92%)] p-3'
                    : 'flex-1 rounded-md border border-border bg-card p-3'
                }
              >
                <div className="mb-1 flex items-center gap-2">
                  <span className="text-sm font-medium">{actor?.name ?? 'Unknown'}</span>
                  {internal && (
                    <span className="rounded-sm bg-[color-mix(in_srgb,var(--chart-3),transparent_82%)] px-1.5 py-0.5 text-[0.625rem] font-semibold uppercase tracking-wide text-[color:var(--chart-3)]">
                      Internal note
                    </span>
                  )}
                  <span className="ml-auto text-xs text-muted-foreground">{time}</span>
                </div>
                <p className="text-sm text-pretty">{event.body}</p>
              </div>
            </li>
          )
        }

        return (
          <li key={event.id} className="flex items-center gap-3 pl-1 text-sm">
            <span
              className={
                danger
                  ? 'grid size-7 shrink-0 place-items-center rounded-full bg-[color-mix(in_srgb,var(--destructive),transparent_88%)] text-destructive'
                  : 'grid size-7 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground'
              }
            >
              <Icon className="size-3.5" />
            </span>
            <span className="text-muted-foreground">
              <span className="font-medium text-foreground">{actor?.name ?? 'System'}</span>{' '}
              {systemText(event, peopleMap)}
            </span>
            <span className="ml-auto text-xs text-muted-foreground">{time}</span>
          </li>
        )
      })}
    </ol>
  )
}
