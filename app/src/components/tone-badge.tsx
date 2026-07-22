import { cn } from '@/lib/utils'
import {
  type Priority,
  type Status,
  type Tone,
  PRIORITY_LABEL,
  PRIORITY_TONE,
  STATUS_LABEL,
  STATUS_TONE,
} from '@/lib/itsm'

// Tone -> soft token-based badge styles. Uses color-mix off semantic tokens so
// every state reads distinctly without raw color literals.
const TONE_CLASS: Record<Tone, string> = {
  neutral: 'bg-muted text-muted-foreground',
  brand: 'bg-primary/10 text-primary',
  info: 'text-[color:var(--chart-2)] bg-[color-mix(in_srgb,var(--chart-2),transparent_88%)]',
  warning: 'text-[color:var(--chart-3)] bg-[color-mix(in_srgb,var(--chart-3),transparent_84%)]',
  success: 'text-[color:var(--chart-5)] bg-[color-mix(in_srgb,var(--chart-5),transparent_86%)]',
  danger: 'text-destructive bg-[color-mix(in_srgb,var(--destructive),transparent_88%)]',
}

const DOT_CLASS: Record<Tone, string> = {
  neutral: 'bg-muted-foreground',
  brand: 'bg-primary',
  info: 'bg-[color:var(--chart-2)]',
  warning: 'bg-[color:var(--chart-3)]',
  success: 'bg-[color:var(--chart-5)]',
  danger: 'bg-destructive',
}

export function ToneBadge({
  tone,
  children,
  dot = false,
  className,
}: {
  tone: Tone
  children: React.ReactNode
  dot?: boolean
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-sm px-2 py-0.5 text-xs font-medium whitespace-nowrap',
        TONE_CLASS[tone],
        className,
      )}
    >
      {dot && <span className={cn('size-1.5 rounded-full', DOT_CLASS[tone])} aria-hidden />}
      {children}
    </span>
  )
}

export function StatusBadge({ status }: { status: Status }) {
  return (
    <ToneBadge tone={STATUS_TONE[status]} dot>
      {STATUS_LABEL[status]}
    </ToneBadge>
  )
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  return <ToneBadge tone={PRIORITY_TONE[priority]}>{PRIORITY_LABEL[priority]}</ToneBadge>
}
