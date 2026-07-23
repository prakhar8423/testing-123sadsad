import { useState } from 'react'
import {
  Bar,
  BarChart,
  Cell,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Trophy } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { PageHeader, EmptyState } from '@/components/page-header'
import { PersonAvatar } from '@/components/person-avatar'
import { type AgentStat, useAgentLeaderboard, usePersonMap } from '@/data'

const RANGES = [
  { key: 7, label: '7 days' },
  { key: 30, label: '30 days' },
  { key: 90, label: '90 days' },
] as const

const PODIUM_SIZE = 3
const CHART_LIMIT = 8

const RANK_STYLE = [
  { ring: 'ring-[var(--chart-1)]', text: 'text-[var(--chart-1)]', label: '1st' },
  { ring: 'ring-[var(--chart-2)]', text: 'text-[var(--chart-2)]', label: '2nd' },
  { ring: 'ring-[var(--chart-3)]', text: 'text-[var(--chart-3)]', label: '3rd' },
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

export default function TopPerformers() {
  const [range, setRange] = useState<number>(30)
  const agents = useAgentLeaderboard(range)
  const peopleMap = usePersonMap()

  const ranked = agents
    .slice()
    .sort((a, b) => b.resolved - a.resolved || (a.avgResolutionHours ?? Infinity) - (b.avgResolutionHours ?? Infinity))

  const hasActivity = ranked.some((a) => a.resolved > 0 || a.assigned > 0)
  const podium = ranked.slice(0, PODIUM_SIZE)
  const chartData = ranked
    .slice(0, CHART_LIMIT)
    .map((a) => ({ name: a.name.split(' ')[0], resolved: a.resolved }))

  return (
    <>
      <PageHeader
        title="Top performing agents"
        description="The agents resolving the most tickets, ranked over the selected range."
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

      {!hasActivity ? (
        <EmptyState
          icon={Trophy}
          title="No agent activity yet"
          description="Once tickets are assigned and resolved in this range, the leaderboard will fill in here."
        />
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {podium.map((a, i) => (
              <PodiumCard key={a.id} rank={i} agent={a} person={peopleMap.get(a.id)} />
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
            <section className="rounded-md border border-border bg-card p-5 xl:col-span-2">
              <h2 className="font-heading text-base font-semibold">Resolved by agent</h2>
              <p className="mb-4 text-xs text-muted-foreground">
                Tickets closed in the selected range.
              </p>
              <ResponsiveContainer width="100%" height={Math.max(200, chartData.length * 36)}>
                <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={70}
                    tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip {...tip} cursor={{ fill: 'var(--muted)' }} />
                  <Bar dataKey="resolved" radius={[0, 4, 4, 0]} barSize={18}>
                    {chartData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </section>

            <section className="rounded-md border border-border bg-card p-5 xl:col-span-3">
              <h2 className="mb-3 font-heading text-base font-semibold">Full ranking</h2>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Agent</TableHead>
                    <TableHead className="text-right">Resolved</TableHead>
                    <TableHead className="text-right">Assigned</TableHead>
                    <TableHead className="text-right">Avg resolution</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ranked.map((a: AgentStat, i) => (
                    <TableRow key={a.id}>
                      <TableCell className="tabular-nums text-muted-foreground">{i + 1}</TableCell>
                      <TableCell>
                        <span className="flex items-center gap-2">
                          <PersonAvatar person={peopleMap.get(a.id)} size="sm" />
                          <span className="font-medium">{a.name}</span>
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-semibold tabular-nums">
                        {a.resolved}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">
                        {a.assigned}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">
                        {a.avgResolutionHours === null ? '—' : `${a.avgResolutionHours}h`}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </section>
          </div>
        </div>
      )}
    </>
  )
}

function PodiumCard({
  rank,
  agent,
  person,
}: {
  rank: number
  agent: AgentStat
  person: ReturnType<ReturnType<typeof usePersonMap>['get']>
}) {
  const style = RANK_STYLE[rank] ?? RANK_STYLE[RANK_STYLE.length - 1]
  return (
    <div className="flex items-center gap-4 rounded-md border border-border bg-card p-5">
      <div className={cn('relative rounded-full ring-2 ring-offset-2 ring-offset-card', style.ring)}>
        <PersonAvatar person={person} size="lg" />
      </div>
      <div className="min-w-0 flex-1">
        <div className={cn('flex items-center gap-1.5 text-xs font-semibold', style.text)}>
          <Trophy className="size-3.5" />
          {style.label}
        </div>
        <p className="truncate font-heading text-base font-semibold">{agent.name}</p>
        <p className="text-xs text-muted-foreground">
          {person?.team ?? 'Support'}
        </p>
      </div>
      <div className="text-right">
        <p className="font-heading text-3xl font-semibold tabular-nums">{agent.resolved}</p>
        <p className="text-xs text-muted-foreground">resolved</p>
      </div>
    </div>
  )
}
