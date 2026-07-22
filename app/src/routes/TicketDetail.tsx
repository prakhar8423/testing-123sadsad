import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { ArrowLeft, BookOpen, CheckCircle2, FileQuestion, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PageHeader, EmptyState } from '@/components/page-header'
import { PriorityBadge, StatusBadge, ToneBadge } from '@/components/tone-badge'
import { SlaClock } from '@/components/sla-indicator'
import { PersonAvatar } from '@/components/person-avatar'
import { TicketTimeline } from '@/components/ticket-timeline'
import { useData } from '@/lib/store'
import { useAgents, useArticles, usePersonMap, useTicket, useTicketEvents } from '@/data'
import {
  type Priority,
  type Status,
  CATEGORY_LABEL,
  PRIORITY_LABEL,
  PRIORITY_OPTIONS,
  STATUS_LABEL,
  STATUS_OPTIONS,
  isOpenStatus,
} from '@/lib/itsm'

const UNASSIGNED = 'unassigned'

export default function TicketDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const ticket = useTicket(id)
  const events = useTicketEvents(id)
  const peopleMap = usePersonMap()
  const agents = useAgents()
  const articles = useArticles()

  const addComment = useData((s) => s.addComment)
  const changeStatus = useData((s) => s.changeStatus)
  const changePriority = useData((s) => s.changePriority)
  const assign = useData((s) => s.assign)
  const attachArticle = useData((s) => s.attachArticle)

  const [reply, setReply] = useState('')
  const [internal, setInternal] = useState(false)

  if (!ticket) {
    return (
      <EmptyState
        icon={FileQuestion}
        title="Ticket not found"
        description={`We couldn't find a ticket with the ID “${id}”. It may have been removed.`}
        action={
          <Button variant="outline" onClick={() => navigate('/tickets')}>
            Back to queue
          </Button>
        }
      />
    )
  }

  const requester = peopleMap.get(ticket.requesterId)
  const assignee = ticket.assigneeId ? peopleMap.get(ticket.assigneeId) : undefined
  const attached = articles.filter((a) => ticket.attachedArticleIds.includes(a.id))
  const canResolve = isOpenStatus(ticket.status)

  function handleSend() {
    const body = reply.trim()
    if (!body) return
    addComment(ticket!.id, body, internal)
    setReply('')
    toast.success(internal ? 'Internal note added' : 'Reply posted')
  }

  function handleAttach(articleId: string) {
    attachArticle(ticket!.id, articleId)
    const title = articles.find((a) => a.id === articleId)?.title
    toast.success('Article attached', { description: title })
  }

  return (
    <>
      <button
        type="button"
        onClick={() => navigate('/tickets')}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to queue
      </button>

      <PageHeader
        title={ticket.subject}
        description={`${ticket.id} · opened ${format(new Date(ticket.createdAt), 'MMM d, yyyy')}`}
        actions={
          canResolve ? (
            <Button onClick={() => changeStatus(ticket.id, 'resolved')}>
              <CheckCircle2 className="size-4" /> Resolve
            </Button>
          ) : (
            <ToneBadge tone="success">Resolved</ToneBadge>
          )
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <PriorityBadge priority={ticket.priority} />
        <StatusBadge status={ticket.status} />
        <ToneBadge tone="neutral">{CATEGORY_LABEL[ticket.category]}</ToneBadge>
        <span className="text-muted-foreground">·</span>
        <SlaClock ticket={ticket} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0">
          <Tabs defaultValue="timeline">
            <TabsList>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
            </TabsList>

            <TabsContent value="timeline" className="mt-4 space-y-5">
              <div className="rounded-md border border-border bg-card p-4">
                <Textarea
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder={internal ? 'Write an internal note…' : 'Write a public reply…'}
                  rows={3}
                />
                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center gap-1 rounded-sm bg-muted p-0.5 text-xs">
                    <button
                      type="button"
                      onClick={() => setInternal(false)}
                      className={
                        !internal
                          ? 'rounded-sm bg-card px-2.5 py-1 font-medium shadow-sm'
                          : 'px-2.5 py-1 text-muted-foreground'
                      }
                    >
                      Public reply
                    </button>
                    <button
                      type="button"
                      onClick={() => setInternal(true)}
                      className={
                        internal
                          ? 'rounded-sm bg-card px-2.5 py-1 font-medium shadow-sm'
                          : 'px-2.5 py-1 text-muted-foreground'
                      }
                    >
                      Internal note
                    </button>
                  </div>
                  <Button size="sm" onClick={handleSend} disabled={!reply.trim()}>
                    <Send className="size-4" /> Send
                  </Button>
                </div>
              </div>
              <TicketTimeline events={events} />
            </TabsContent>

            <TabsContent value="details" className="mt-4">
              <div className="rounded-md border border-border bg-card p-5">
                <h3 className="mb-2 font-heading text-base font-semibold">Description</h3>
                <p className="text-sm text-pretty text-muted-foreground">
                  {ticket.description || 'No description provided.'}
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <aside className="space-y-4">
          <div className="space-y-4 rounded-md border border-border bg-card p-5">
            <Field label="Status">
              <Select value={ticket.status} onValueChange={(v) => changeStatus(ticket.id, v as Status)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {STATUS_LABEL[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Priority">
              <Select value={ticket.priority} onValueChange={(v) => changePriority(ticket.id, v as Priority)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITY_OPTIONS.map((p) => (
                    <SelectItem key={p} value={p}>
                      {PRIORITY_LABEL[p]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Assignee">
              <Select
                value={ticket.assigneeId ?? UNASSIGNED}
                onValueChange={(v) => assign(ticket.id, v === UNASSIGNED ? null : v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={UNASSIGNED}>Unassigned</SelectItem>
                  {agents.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <div className="space-y-3 rounded-md border border-border bg-card p-5">
            <PersonLine label="Requester" name={requester?.name} team={requester?.team} person={requester} />
            <Separator />
            <PersonLine label="Assignee" name={assignee?.name ?? 'Unassigned'} team={assignee?.team} person={assignee} />
          </div>

          <div className="rounded-md border border-border bg-card p-5">
            <div className="mb-3 flex items-center gap-2">
              <BookOpen className="size-4 text-muted-foreground" />
              <h3 className="font-heading text-sm font-semibold">Knowledge base</h3>
            </div>
            {attached.length > 0 && (
              <ul className="mb-3 space-y-1.5">
                {attached.map((a) => (
                  <li key={a.id}>
                    <Link to={`/kb/${a.id}`} className="text-sm text-accent hover:underline">
                      {a.title}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <Select value="" onValueChange={handleAttach}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Attach an article…" />
              </SelectTrigger>
              <SelectContent>
                {articles
                  .filter((a) => !ticket.attachedArticleIds.includes(a.id))
                  .map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.title}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </aside>
      </div>
    </>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </div>
  )
}

function PersonLine({
  label,
  name,
  team,
  person,
}: {
  label: string
  name?: string
  team?: string
  person?: Parameters<typeof PersonAvatar>[0]['person']
}) {
  return (
    <div className="flex items-center gap-3">
      <PersonAvatar person={person} size="md" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-medium">{name ?? 'Unassigned'}</p>
        {team && <p className="text-xs text-muted-foreground">{team}</p>}
      </div>
    </div>
  )
}
