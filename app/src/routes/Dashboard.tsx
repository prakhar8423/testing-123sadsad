import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { AlarmClock, Inbox, Timer, TriangleAlert } from 'lucide-react'
import { PageHeader, EmptyState } from '@/components/page-header'
import { PriorityBadge, StatusBadge } from '@/components/tone-badge'
import { SlaCell } from '@/components/sla-indicator'
import { ActivityFeed } from '@/components/activity-feed'
import { Button } from '@/components/ui/button'
import { useUiStore } from '@/lib/ui-store'
import {
  useAtRiskTickets,
  useByStatus,
  useDashboardKpis,
  useOpenByPriority,
  useTickets,
  useVolumeSeries,
} from '@/data'
import type { Priority } from '@/lib/itsm'

const CHART_COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
]
const VOLUME_DAYS = 14
const AT_RISK_LIMIT = 6
const ACTIVITY_LIMIT = 8

function tooltipStyle() {
  return {
    contentStyle: {
      background: 'var(--popover)',
      border: '1px solid var(--border)',
      borderRadius: '0.375rem',
      color: 'var(--popover-foreground)',
      fontSize: '0.8125rem',
    },
    labelStyle: { color: 'var(--muted-foreground)' },
  }
}

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  danger,
  onClick,
}: {
  label: string
  value: string
  hint: string
  icon: React.ComponentType<{ className?: string }>
  danger?: boolean
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex flex-col gap-2 rounded-md border border-border bg-card p-5 text-left transition-colors hover:border-primary/40"
    >
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <Icon className={danger ? 'size-4 text-destructive' : 'size-4 text-muted-foreground'} />
      </div>
      <span
        className={
          danger
            ? 'font-heading text-3xl font-semibold text-destructive'
            : 'font-heading text-3xl font-semibold'
        }
      >
        {value}
      </span>
      <span className="text-xs text-muted-foreground">{hint}</span>
    </button>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const tickets = useTickets()
  const kpis = useDashboardKpis()
  const byPriority = useOpenByPriority()
  const byStatus = useByStatus()
  const volume = useVolumeSeries(VOLUME_DAYS)
  const atRisk = useAtRiskTickets(AT_RISK_LIMIT)
  const clearFilters = useUiStore((s) => s.clearFilters)
  const setPriorityFilter = useUiStore((s) => s.setPriorityFilter)
  const setScope = useUiStore((s) => s.setScope)

  const avgResponse = useMemo(
    () =>
      kpis.avgFirstResponseHours === null
        ? '—'
        : `${kpis.avgFirstResponseHours.toFixed(1)}h`,
    [kpis.avgFirstResponseHours],
  )

  function goPriority(priority: Priority) {
    clearFilters()
    setPriorityFilter(priority)
    navigate('/tickets')
  }

  function goScope(scope: 'all' | 'at_risk') {
    clearFilters()
    setScope(scope)
    navigate('/tickets')
  }

  if (tickets.length === 0) {
    return (
      <>
        <PageHeader title="Dashboard" description="Service-desk health at a glance." />
        <EmptyState
          icon={Inbox}
          title="Your service desk is empty"
          description="No tickets yet. Log your first incident or browse the service catalog to get started."
          action={
            <Button onClick={() => navigate('/catalog')} variant="outline">
              Open the catalog
            </Button>
          }
        />
      </>
    )
  }

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Live queue health, SLA risk, and recent activity across the service desk."
      />

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Open tickets"
          value={String(kpis.open)}
          hint="Across all agents and teams"
          icon={Inbox}
          onClick={() => goScope('all')}
        />
        <StatCard
          label="SLA breached"
          value={String(kpis.breached)}
          hint="Past due and unresolved"
          icon={TriangleAlert}
          danger={kpis.breached > 0}
          onClick={() => goScope('at_risk')}
        />
        <StatCard
          label="Resolved today"
          value={String(kpis.resolvedToday)}
          hint="Closed in the last 24h"
          icon={AlarmClock}
        />
        <StatCard
          label="Avg first response"
          value={avgResponse}
          hint="From creation to first reply"
          icon={Timer}
        />
      </section>

      <section className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="rounded-md border border-border bg-card p-5 xl:col-span-2">
          <h2 className="font-heading text-base font-semibold">14-day ticket volume</h2>
          <p className="mb-4 text-xs text-muted-foreground">Created versus resolved per day.</p>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={volume} margin={{ left: -16, right: 8, top: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} interval={2} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} allowDecimals={false} width={32} />
              <Tooltip {...tooltipStyle()} />
              <Legend wrapperStyle={{ fontSize: '0.75rem' }} />
              <Line type="monotone" dataKey="created" name="Created" stroke="var(--chart-1)" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="resolved" name="Resolved" stroke="var(--chart-2)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-md border border-border bg-card p-5">
          <h2 className="font-heading text-base font-semibold">By status</h2>
          <p className="mb-4 text-xs text-muted-foreground">All tickets by current status.</p>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={byStatus} dataKey="value" nameKey="label" innerRadius={52} outerRadius={82} paddingAngle={2} stroke="var(--card)">
                {byStatus.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip {...tooltipStyle()} />
              <Legend wrapperStyle={{ fontSize: '0.75rem' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="rounded-md border border-border bg-card p-5">
          <h2 className="font-heading text-base font-semibold">Open by priority</h2>
          <p className="mb-4 text-xs text-muted-foreground">Click a bar to filter the queue.</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={byPriority} margin={{ left: -16, right: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} allowDecimals={false} width={32} />
              <Tooltip {...tooltipStyle()} cursor={{ fill: 'var(--muted)' }} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]} className="cursor-pointer" onClick={(d) => goPriority((d as { key: Priority }).key)}>
                {byPriority.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-md border border-border bg-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-heading text-base font-semibold">SLA at risk</h2>
            <Button variant="ghost" size="sm" onClick={() => goScope('at_risk')}>
              View all
            </Button>
          </div>
          {atRisk.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Nothing at risk. Nice.</p>
          ) : (
            <ul className="space-y-1">
              {atRisk.map((t) => (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => navigate(`/tickets/${t.id}`)}
                    className="flex w-full items-center gap-3 rounded-sm px-2 py-2 text-left transition-colors hover:bg-muted"
                  >
                    <PriorityBadge priority={t.priority} />
                    <span className="min-w-0 flex-1 truncate text-sm">{t.subject}</span>
                    <SlaCell ticket={t} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-md border border-border bg-card p-5">
          <h2 className="mb-3 font-heading text-base font-semibold">Recent activity</h2>
          <ActivityFeed limit={ACTIVITY_LIMIT} />
        </div>
      </section>
    </>
  )
}
