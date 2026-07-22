import { useMemo, useState } from 'react'
import * as Icons from 'lucide-react'
import { SearchX } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { PageHeader, EmptyState } from '@/components/page-header'
import { CreateTicketDialog } from '@/components/create-ticket-dialog'
import { useCatalog } from '@/data'
import { type CatalogItem, CATEGORY_LABEL, CATEGORY_OPTIONS } from '@/lib/itsm'

type LucideIcon = React.ComponentType<{ className?: string }>

function iconFor(name: string): LucideIcon {
  const map = Icons as unknown as Record<string, LucideIcon>
  return map[name] ?? Icons.Package
}

export default function Catalog() {
  const items = useCatalog()
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<CatalogItem | null>(null)

  const q = query.trim().toLowerCase()
  const filtered = useMemo(
    () =>
      items.filter(
        (i) => i.title.toLowerCase().includes(q) || i.description.toLowerCase().includes(q),
      ),
    [items, q],
  )

  const grouped = CATEGORY_OPTIONS.map((cat) => ({
    category: cat,
    items: filtered.filter((i) => i.category === cat),
  })).filter((g) => g.items.length > 0)

  return (
    <>
      <PageHeader
        title="Service catalog"
        description="Request standard IT services. Each request is tracked as a ticket in the queue."
      />

      <div className="relative mb-6 max-w-md">
        <Icons.Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search the catalog…"
          className="pl-9"
          aria-label="Search catalog"
        />
      </div>

      {grouped.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title="No matching services"
          description="No catalog items match your search. Try a different term."
          action={
            <Button variant="outline" onClick={() => setQuery('')}>
              Clear search
            </Button>
          }
        />
      ) : (
        <div className="space-y-8">
          {grouped.map((group) => (
            <section key={group.category}>
              <h2 className="mb-3 font-heading text-sm font-semibold text-muted-foreground">
                {CATEGORY_LABEL[group.category]}
              </h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {group.items.map((item) => {
                  const Icon = iconFor(item.icon)
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelected(item)}
                      className="group flex flex-col gap-2 rounded-md border border-border bg-card p-4 text-left transition-colors hover:border-primary/40"
                    >
                      <div className="flex items-center gap-2">
                        <span className="grid size-9 place-items-center rounded-md bg-primary/10 text-primary">
                          <Icon className="size-4" />
                        </span>
                        <span className="font-medium">{item.title}</span>
                      </div>
                      <p className="text-sm text-pretty text-muted-foreground">{item.description}</p>
                      <span className="mt-1 text-xs text-muted-foreground">
                        Typically {item.fulfillmentDays} day{item.fulfillmentDays > 1 ? 's' : ''}
                      </span>
                    </button>
                  )
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      <CreateTicketDialog
        open={selected !== null}
        onOpenChange={(o) => !o && setSelected(null)}
        catalogItem={selected}
      />
    </>
  )
}
