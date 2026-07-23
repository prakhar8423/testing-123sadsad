import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import {
  BookOpen,
  LayoutDashboard,
  LifeBuoy,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Search,
  ShoppingBag,
  Ticket as TicketIcon,
  Trophy,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ThemeToggle } from '@/components/theme-toggle'
import { CreateTicketDialog } from '@/components/create-ticket-dialog'
import { PersonAvatar } from '@/components/person-avatar'
import { useUiStore } from '@/lib/ui-store'
import { usePersonMap } from '@/data'
import { CURRENT_AGENT_ID } from '@/lib/itsm'

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/tickets', label: 'Tickets', icon: TicketIcon, end: false },
  { to: '/catalog', label: 'Service catalog', icon: ShoppingBag, end: false },
  { to: '/kb', label: 'Knowledge base', icon: BookOpen, end: false },
  { to: '/reports', label: 'Reports', icon: LifeBuoy, end: false },
  { to: '/top-performers', label: 'Top performers', icon: Trophy, end: false },
] as const

export function AppShell({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate()
  const collapsed = useUiStore((s) => s.sidebarCollapsed)
  const toggleSidebar = useUiStore((s) => s.toggleSidebar)
  const setScope = useUiStore((s) => s.setScope)
  const setSearch = useUiStore((s) => s.setSearch)
  const [createOpen, setCreateOpen] = useState(false)
  const [topSearch, setTopSearch] = useState('')
  const peopleMap = usePersonMap()
  const currentAgent = peopleMap.get(CURRENT_AGENT_ID)

  function handleGlobalSearch(e: React.FormEvent) {
    e.preventDefault()
    setScope('all')
    setSearch(topSearch)
    navigate('/tickets')
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside
        className={cn(
          'sticky top-0 hidden h-screen shrink-0 flex-col border-r border-border bg-sidebar text-sidebar-foreground transition-[width] duration-200 md:flex',
          collapsed ? 'w-16' : 'w-60',
        )}
      >
        <div className="flex h-16 items-center gap-2 px-4">
          <span className="grid size-8 shrink-0 place-items-center rounded-md bg-primary text-primary-foreground">
            <LifeBuoy className="size-4" />
          </span>
          {!collapsed && <span className="font-heading text-lg font-semibold">Fieldpost</span>}
        </div>

        <nav className="flex flex-1 flex-col gap-1 px-3 py-2">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-sm px-3 py-2 text-sm font-medium transition-colors',
                  'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-sidebar-foreground/80',
                  collapsed && 'justify-center px-0',
                )
              }
              title={collapsed ? label : undefined}
            >
              <Icon className="size-4 shrink-0" />
              {!collapsed && <span className="truncate">{label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="p-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-background/85 px-4 backdrop-blur md:px-6">
          <form onSubmit={handleGlobalSearch} className="relative w-full max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={topSearch}
              onChange={(e) => setTopSearch(e.target.value)}
              placeholder="Search tickets by subject, requester, or ID…"
              className="pl-9"
              aria-label="Global ticket search"
            />
          </form>
          <div className="ml-auto flex items-center gap-2">
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="size-4" /> New ticket
            </Button>
            <ThemeToggle />
            <Link
              to="/reports"
              className="flex items-center gap-2 rounded-sm px-1 py-1 hover:bg-accent/10"
              aria-label="Current agent"
            >
              <PersonAvatar person={currentAgent} size="sm" />
            </Link>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 md:px-6 md:py-8">{children}</main>
      </div>

      <CreateTicketDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  )
}
