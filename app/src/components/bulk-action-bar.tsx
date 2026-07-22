import { toast } from 'sonner'
import { UserCog, RefreshCcw, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useData } from '@/lib/store'
import { useUiStore } from '@/lib/ui-store'
import { useAgents } from '@/data'
import { STATUS_LABEL, STATUS_OPTIONS, type Status } from '@/lib/itsm'

export function BulkActionBar() {
  const selectedIds = useUiStore((s) => s.selectedIds)
  const clearSelected = useUiStore((s) => s.clearSelected)
  const bulkAssign = useData((s) => s.bulkAssign)
  const bulkStatus = useData((s) => s.bulkStatus)
  const agents = useAgents()

  if (selectedIds.length === 0) return null
  const count = selectedIds.length

  function handleAssign(agentId: string | null, name: string) {
    bulkAssign(selectedIds, agentId)
    toast.success(`Reassigned ${count} ticket${count > 1 ? 's' : ''} to ${name}`)
    clearSelected()
  }

  function handleStatus(status: Status) {
    bulkStatus(selectedIds, status)
    toast.success(`Moved ${count} ticket${count > 1 ? 's' : ''} to ${STATUS_LABEL[status]}`)
    clearSelected()
  }

  return (
    <div className="sticky bottom-4 z-10 mx-auto flex w-fit items-center gap-2 rounded-md border border-border bg-popover px-3 py-2 shadow-lg">
      <span className="px-1 text-sm font-medium">{count} selected</span>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <UserCog className="size-4" /> Assign
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuLabel>Assign to</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => handleAssign(null, 'Unassigned')}>
            Unassigned
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {agents.map((a) => (
            <DropdownMenuItem key={a.id} onClick={() => handleAssign(a.id, a.name)}>
              {a.name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <RefreshCcw className="size-4" /> Status
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuLabel>Set status</DropdownMenuLabel>
          {STATUS_OPTIONS.map((s) => (
            <DropdownMenuItem key={s} onClick={() => handleStatus(s)}>
              {STATUS_LABEL[s]}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <Button variant="ghost" size="icon" onClick={clearSelected} aria-label="Clear selection">
        <X className="size-4" />
      </Button>
    </div>
  )
}
