import { useData } from '@/lib/store'
import type { Person } from '@/lib/itsm'

export function usePeople(): Person[] {
  return useData((s) => s.people)
}

export function useAgents(): Person[] {
  const people = usePeople()
  return people.filter((p) => p.role === 'agent')
}

export function usePersonMap(): Map<string, Person> {
  const people = usePeople()
  return new Map(people.map((p) => [p.id, p]))
}

export function initials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}
