import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useData } from '@/lib/store'
import { usePeople } from '@/data'
import {
  type Category,
  type CatalogItem,
  type Priority,
  CATEGORY_LABEL,
  CATEGORY_OPTIONS,
  PRIORITY_LABEL,
  PRIORITY_OPTIONS,
  SLA_HOURS_BY_PRIORITY,
} from '@/lib/itsm'

const UNASSIGNED = 'unassigned'

export function CreateTicketDialog({
  open,
  onOpenChange,
  catalogItem,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  catalogItem?: CatalogItem | null
}) {
  const navigate = useNavigate()
  const people = usePeople()
  const createTicket = useData((s) => s.createTicket)
  const agents = people.filter((p) => p.role === 'agent')
  const requesters = people.filter((p) => p.role === 'requester')

  const isRequest = Boolean(catalogItem)
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')
  const [requesterId, setRequesterId] = useState('')
  const [category, setCategory] = useState<Category>(catalogItem?.category ?? 'software')
  const [priority, setPriority] = useState<Priority>('medium')
  const [assigneeId, setAssigneeId] = useState<string>(UNASSIGNED)
  const [touched, setTouched] = useState(false)

  const effectiveSubject = isRequest && catalogItem ? `${catalogItem.title}: ${subject}` : subject
  const subjectError = touched && subject.trim().length === 0
  const requesterError = touched && !requesterId

  function reset() {
    setSubject('')
    setDescription('')
    setRequesterId('')
    setCategory(catalogItem?.category ?? 'software')
    setPriority('medium')
    setAssigneeId(UNASSIGNED)
    setTouched(false)
  }

  function handleSubmit() {
    setTouched(true)
    if (subject.trim().length === 0 || !requesterId) return
    const ticket = createTicket({
      type: isRequest ? 'request' : 'incident',
      subject: effectiveSubject,
      description,
      requesterId,
      category,
      priority,
      assigneeId: assigneeId === UNASSIGNED ? null : assigneeId,
      catalogItemId: catalogItem?.id ?? null,
    })
    toast.success(`${ticket.id} created`, { description: ticket.subject })
    onOpenChange(false)
    reset()
    navigate(`/tickets/${ticket.id}`)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o)
        if (!o) reset()
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-heading">
            {isRequest ? `New request · ${catalogItem?.title}` : 'Log a new incident'}
          </DialogTitle>
          <DialogDescription>
            {isRequest
              ? 'Submit this service request to the queue.'
              : 'Capture the issue; the SLA target is derived from priority.'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-1.5">
            <Label htmlFor="subject">{isRequest ? 'Details' : 'Subject'}</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder={isRequest ? 'e.g. 15-inch, for a new designer' : 'Short summary of the issue'}
              aria-invalid={subjectError}
            />
            {subjectError && <p className="text-xs text-destructive">A subject is required.</p>}
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What happened, steps to reproduce, impact…"
              rows={3}
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="requester">Requester</Label>
            <Select value={requesterId} onValueChange={setRequesterId}>
              <SelectTrigger id="requester" aria-invalid={requesterError}>
                <SelectValue placeholder="Who is this for?" />
              </SelectTrigger>
              <SelectContent>
                {requesters.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} · {p.team}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {requesterError && <p className="text-xs text-destructive">Select a requester.</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="category">Category</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as Category)}>
                <SelectTrigger id="category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map((c) => (
                    <SelectItem key={c} value={c}>
                      {CATEGORY_LABEL[c]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="priority">Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
                <SelectTrigger id="priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITY_OPTIONS.map((p) => (
                    <SelectItem key={p} value={p}>
                      {PRIORITY_LABEL[p]} · {SLA_HOURS_BY_PRIORITY[p]}h SLA
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="assignee">Assignee</Label>
            <Select value={assigneeId} onValueChange={setAssigneeId}>
              <SelectTrigger id="assignee">
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
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Create ticket</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
