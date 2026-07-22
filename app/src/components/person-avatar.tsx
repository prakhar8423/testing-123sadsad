import { cn } from '@/lib/utils'
import { initials } from '@/data'
import type { Person } from '@/lib/itsm'

const SIZE_CLASS = {
  sm: 'size-6 text-[0.625rem]',
  md: 'size-8 text-xs',
  lg: 'size-10 text-sm',
} as const

export function PersonAvatar({
  person,
  size = 'md',
  className,
}: {
  person: Person | undefined
  size?: keyof typeof SIZE_CLASS
  className?: string
}) {
  if (!person) {
    return (
      <span
        className={cn(
          'inline-flex items-center justify-center rounded-full bg-muted text-muted-foreground font-medium',
          SIZE_CLASS[size],
          className,
        )}
        aria-hidden
      >
        ?
      </span>
    )
  }
  const bg = `oklch(0.92 0.05 ${person.avatarHue})`
  const fg = `oklch(0.35 0.09 ${person.avatarHue})`
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full font-semibold',
        SIZE_CLASS[size],
        className,
      )}
      style={{ backgroundColor: bg, color: fg }}
      title={person.name}
      aria-label={person.name}
    >
      {initials(person.name)}
    </span>
  )
}
