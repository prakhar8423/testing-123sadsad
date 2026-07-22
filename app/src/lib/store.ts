import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  type Article,
  type CatalogItem,
  type Category,
  type Person,
  type Priority,
  type Status,
  type Ticket,
  type TimelineEvent,
  type TimelineKind,
  CURRENT_AGENT_ID,
  computeSlaDue,
  isOpenStatus,
} from '@/lib/itsm'
import { ARTICLES, CATALOG_ITEMS, buildPeople, buildTickets } from '@/lib/seed'

const STORAGE_KEY = 'fieldpost-data-v1'

function buildSeed() {
  const people = buildPeople()
  const { tickets, events } = buildTickets(people)
  return {
    people,
    tickets,
    events,
    catalog: CATALOG_ITEMS,
    articles: ARTICLES,
  }
}

let idCounter = Date.now()
const uid = (prefix: string) => `${prefix}-${(idCounter++).toString(36)}`

export interface NewTicketInput {
  type: Ticket['type']
  subject: string
  description: string
  requesterId: string
  category: Category
  priority: Priority
  assigneeId: string | null
  catalogItemId?: string | null
}

interface DataState {
  people: Person[]
  tickets: Ticket[]
  events: TimelineEvent[]
  catalog: CatalogItem[]
  articles: Article[]

  createTicket: (input: NewTicketInput) => Ticket
  addComment: (ticketId: string, body: string, internal: boolean) => void
  changeStatus: (ticketId: string, status: Status) => void
  changePriority: (ticketId: string, priority: Priority) => void
  assign: (ticketId: string, assigneeId: string | null) => void
  bulkAssign: (ids: string[], assigneeId: string | null) => void
  bulkStatus: (ids: string[], status: Status) => void
  attachArticle: (ticketId: string, articleId: string) => void
  articleFeedback: (articleId: string, helpful: boolean) => void
  incrementViews: (articleId: string) => void
  resetDemoData: () => void
}

function nextSequentialId(tickets: Ticket[], type: Ticket['type']): string {
  const prefix = type === 'incident' ? 'INC' : 'REQ'
  const max = tickets
    .filter((t) => t.id.startsWith(prefix))
    .reduce((m, t) => Math.max(m, Number(t.id.split('-')[1]) || 0), 0)
  return `${prefix}-${String(max + 1).padStart(3, '0')}`
}

function pushEvent(
  events: TimelineEvent[],
  ticketId: string,
  kind: TimelineKind,
  extra: Partial<TimelineEvent> = {},
): TimelineEvent[] {
  return [
    ...events,
    {
      id: uid('evt'),
      ticketId,
      kind,
      actorId: CURRENT_AGENT_ID,
      createdAt: new Date().toISOString(),
      ...extra,
    },
  ]
}

export const useData = create<DataState>()(
  persist(
    (set, get) => ({
      ...buildSeed(),

      createTicket: (input) => {
        const nowIso = new Date().toISOString()
        const id = nextSequentialId(get().tickets, input.type)
        const ticket: Ticket = {
          id,
          type: input.type,
          subject: input.subject.trim(),
          description: input.description.trim(),
          requesterId: input.requesterId,
          assigneeId: input.assigneeId,
          category: input.category,
          priority: input.priority,
          status: 'new',
          createdAt: nowIso,
          updatedAt: nowIso,
          slaDueAt: computeSlaDue(input.priority, nowIso),
          slaBreached: false,
          firstResponseAt: null,
          catalogItemId: input.catalogItemId ?? null,
          attachedArticleIds: [],
        }
        set((s) => {
          let events = pushEvent(s.events, id, 'created', { actorId: input.requesterId })
          if (input.assigneeId)
            events = pushEvent(events, id, 'assigned', { meta: { to: input.assigneeId } })
          return { tickets: [ticket, ...s.tickets], events }
        })
        return ticket
      },

      addComment: (ticketId, body, internal) =>
        set((s) => {
          const nowIso = new Date().toISOString()
          const events = pushEvent(s.events, ticketId, internal ? 'internal_note' : 'comment', {
            body: body.trim(),
          })
          return {
            events,
            tickets: s.tickets.map((t) =>
              t.id === ticketId
                ? { ...t, updatedAt: nowIso, firstResponseAt: t.firstResponseAt ?? nowIso }
                : t,
            ),
          }
        }),

      changeStatus: (ticketId, status) =>
        set((s) => {
          const nowIso = new Date().toISOString()
          const ticket = s.tickets.find((t) => t.id === ticketId)
          if (!ticket || ticket.status === status) return s
          let events = pushEvent(s.events, ticketId, 'status_changed', {
            meta: { from: ticket.status, to: status },
          })
          if (status === 'resolved') events = pushEvent(events, ticketId, 'resolved')
          return {
            events,
            tickets: s.tickets.map((t) =>
              t.id === ticketId
                ? { ...t, status, updatedAt: nowIso, slaBreached: isOpenStatus(status) && t.slaBreached }
                : t,
            ),
          }
        }),

      changePriority: (ticketId, priority) =>
        set((s) => {
          const nowIso = new Date().toISOString()
          const ticket = s.tickets.find((t) => t.id === ticketId)
          if (!ticket || ticket.priority === priority) return s
          const events = pushEvent(s.events, ticketId, 'priority_changed', {
            meta: { from: ticket.priority, to: priority },
          })
          return {
            events,
            tickets: s.tickets.map((t) =>
              t.id === ticketId
                ? {
                    ...t,
                    priority,
                    updatedAt: nowIso,
                    slaDueAt: computeSlaDue(priority, t.createdAt),
                  }
                : t,
            ),
          }
        }),

      assign: (ticketId, assigneeId) =>
        set((s) => {
          const nowIso = new Date().toISOString()
          const events = pushEvent(s.events, ticketId, 'assigned', {
            meta: { to: assigneeId ?? 'unassigned' },
          })
          return {
            events,
            tickets: s.tickets.map((t) =>
              t.id === ticketId ? { ...t, assigneeId, updatedAt: nowIso } : t,
            ),
          }
        }),

      bulkAssign: (ids, assigneeId) =>
        set((s) => {
          const nowIso = new Date().toISOString()
          let events = s.events
          ids.forEach((id) => {
            events = pushEvent(events, id, 'assigned', { meta: { to: assigneeId ?? 'unassigned' } })
          })
          return {
            events,
            tickets: s.tickets.map((t) =>
              ids.includes(t.id) ? { ...t, assigneeId, updatedAt: nowIso } : t,
            ),
          }
        }),

      bulkStatus: (ids, status) =>
        set((s) => {
          const nowIso = new Date().toISOString()
          let events = s.events
          ids.forEach((id) => {
            events = pushEvent(events, id, 'status_changed', { meta: { to: status } })
          })
          return {
            events,
            tickets: s.tickets.map((t) =>
              ids.includes(t.id) ? { ...t, status, updatedAt: nowIso } : t,
            ),
          }
        }),

      attachArticle: (ticketId, articleId) =>
        set((s) => ({
          tickets: s.tickets.map((t) =>
            t.id === ticketId && !t.attachedArticleIds.includes(articleId)
              ? { ...t, attachedArticleIds: [...t.attachedArticleIds, articleId] }
              : t,
          ),
        })),

      articleFeedback: (articleId, helpful) =>
        set((s) => ({
          articles: s.articles.map((a) =>
            a.id === articleId
              ? {
                  ...a,
                  helpfulYes: a.helpfulYes + (helpful ? 1 : 0),
                  helpfulNo: a.helpfulNo + (helpful ? 0 : 1),
                }
              : a,
          ),
        })),

      incrementViews: (articleId) =>
        set((s) => ({
          articles: s.articles.map((a) =>
            a.id === articleId ? { ...a, views: a.views + 1 } : a,
          ),
        })),

      resetDemoData: () => set({ ...buildSeed() }),
    }),
    { name: STORAGE_KEY },
  ),
)
