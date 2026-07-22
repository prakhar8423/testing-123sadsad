import { useState } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { PageHeader } from '@/components/page-header'
import { PersonAvatar } from '@/components/person-avatar'
import {
  type AgentStat,
  useAgentLeaderboard,
  useByCategory,
  usePersonMap,
  useResolutionTrend,
} from '@/data'

const RANGES = [
  { key: 7, label: '7 days' },
  { key: 30, label: '30 days' },
  { key: 90, label: '90 days' },
] as const

const CHART_COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
]

const tip = {
  contentStyle: {
    background: 'var(--popover)',
    border: '1px solid var(--border)',
    borderRadius: '0.375rem',
    color: 'var(--popover-foreground)',
    fontSize: '0.8125rem',
  },
  labelStyle: { color: 'var(--muted-foreground)' },
}

type SortKey = 'name' | 'assigned' | 'resolved' | 'avgResolutionHours'

export default function Reports() {
  const [range, setRange] = useState<number>(30)
  const [sortKey, setSortKey] = useState<SortKey>('resolved')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  const resolution = useResolutionTrend(range)
  const byCategory = useByCategory(range)
  const agents = useAgentLeaderboard(range)
  const peopleMap = usePersonMap()

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  const dir = sortDir === 'asc' ? 1 : -1
  const sortedAgents = agents.slice().sort((a, b) => {
    if (sortKey === 'name') return a.name.localeCompare(b.name) * dir
    const av = a[sortKey] ?? -1
    const bv = b[sortKey] ?? -1
    return (Number(av) - Number(bv)) * dir
  })

  return (
    <>
      <PageHeader
        title="Reports"
        description="Resolution performance, ticket mix, and agent throughput."
        actions={
          <div className="flex items-center gap-1 rounded-md bg-muted p-1">
            {RANGES.map((r) => (
              <button
                key={r.key}
                type="button"
                onClick={() => setRange(r.key)}
                className={cn(
                  'rounded-sm px-3 py-1.5 text-sm font-medium transition-colors',
                  range === r.key
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {r.label}
              </button>
            ))}
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="rounded-md border border-border bg-card p-5">
          <h2 className="font-heading text-base font-semibold">Avg resolution time</h2>
          <p className="mb-4 text-xs text-muted-foreground">Hours to resolve, over the range.</p>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={resolution} margin={{ left: -16, right: 8, top: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} width={32} />
              <Tooltip {...tip} formatter={(v) => [`${v}h`, 'Avg']} />
              <Line type="monotone" dataKey="hours" stroke="var(--chart-1)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-md border border-border bg-card p-5">
          <h2 className="font-heading text-base font-semibold">SLA compliance</h2>
          <p className="mb-4 text-xs text-muted-foreground">Percent resolved within SLA.</p>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={resolution} margin={{ left: -16, right: 8, top: 4 }}>
              <defs>
                <linearGradient id="compliance" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-5)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--chart-5)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} width={32} />
              <Tooltip {...tip} formatter={(v) => [`${v}%`, 'Compliance']} />
              <Area type="monotone" dataKey="compliance" stroke="var(--chart-5)" strokeWidth={2} fill="url(#compliance)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-md border border-border bg-card p-5 xl:col-span-2">
          <h2 className="font-heading text-base font-semibold">Tickets by category</h2>
          <p className="mb-4 text-xs text-muted-foreground">Volume created in the selected range.</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={byCategory} margin={{ left: -16, right: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} allowDecimals={false} width={32} />
              <Tooltip {...tip} cursor={{ fill: 'var(--muted)' }} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {byCategory.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <section className="mt-4 rounded-md border border-border bg-card p-5">
        <h2 className="mb-3 font-heading text-base font-semibold">Agent leaderboard</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <SortButton label="Agent" active={sortKey === 'name'} dir={sortDir} onClick={() => toggleSort('name')} />
              </TableHead>
              <TableHead className="text-right">
                <SortButton label="Assigned" active={sortKey === 'assigned'} dir={sortDir} onClick={() => toggleSort('assigned')} />
              </TableHead>
              <TableHead className="text-right">
                <SortButton label="Resolved" active={sortKey === 'resolved'} dir={sortDir} onClick={() => toggleSort('resolved')} />
              </TableHead>
              <TableHead className="text-right">
                <SortButton label="Avg resolution" active={sortKey === 'avgResolutionHours'} dir={sortDir} onClick={() => toggleSort('avgResolutionHours')} />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedAgents.map((a: AgentStat) => (
              <TableRow key={a.id}>
                <TableCell>
                  <span className="flex items-center gap-2">
                    <PersonAvatar person={peopleMap.get(a.id)} size="sm" />
                    <span className="font-medium">{a.name}</span>
                  </span>
                </TableCell>
                <TableCell className="text-right tabular-nums">{a.assigned}</TableCell>
                <TableCell className="text-right tabular-nums">{a.resolved}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {a.avgResolutionHours === null ? '—' : `${a.avgResolutionHours}h`}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>
    </>
  )
}

function SortButton({
  label,
  active,
  dir,
  onClick,
}: {
  label: string
  active: boolean
  dir: 'asc' | 'desc'
  onClick: () => void
}) {
  const Icon = !active ? ChevronsUpDown : dir === 'asc' ? ArrowUp : ArrowDown
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1 transition-colors hover:text-foreground',
        active ? 'text-foreground' : 'text-muted-foreground',
      )}
    >
      {label}
      <Icon className="size-3.5" />
    </button>
  )
}
