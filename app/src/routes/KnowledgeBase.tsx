import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { formatDistanceToNowStrict } from 'date-fns'
import { Eye, Search, SearchX } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { PageHeader, EmptyState } from '@/components/page-header'
import { ToneBadge } from '@/components/tone-badge'
import { useArticles } from '@/data'
import { CATEGORY_LABEL } from '@/lib/itsm'

export default function KnowledgeBase() {
  const articles = useArticles()
  const [query, setQuery] = useState('')
  const q = query.trim().toLowerCase()

  const filtered = useMemo(
    () =>
      articles
        .filter(
          (a) =>
            a.title.toLowerCase().includes(q) ||
            a.excerpt.toLowerCase().includes(q) ||
            a.body.some((p) => p.toLowerCase().includes(q)),
        )
        .sort((a, b) => b.views - a.views),
    [articles, q],
  )

  return (
    <>
      <PageHeader
        title="Knowledge base"
        description="Search self-service articles and attach them to tickets."
      />

      <div className="relative mb-6 max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search articles…"
          className="pl-9"
          aria-label="Search knowledge base"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title="No articles found"
          description="No articles match your search. Try a different keyword."
          action={
            <Button variant="outline" onClick={() => setQuery('')}>
              Clear search
            </Button>
          }
        />
      ) : (
        <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {filtered.map((a) => (
            <li key={a.id}>
              <Link
                to={`/kb/${a.id}`}
                className="group flex h-full flex-col gap-2 rounded-md border border-border bg-card p-4 transition-colors hover:border-primary/40"
              >
                <div className="flex items-center justify-between gap-2">
                  <ToneBadge tone="neutral">{CATEGORY_LABEL[a.category]}</ToneBadge>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Eye className="size-3.5" /> {a.views.toLocaleString()}
                  </span>
                </div>
                <h2 className="font-heading text-base font-semibold text-balance group-hover:text-primary">
                  {a.title}
                </h2>
                <p className="text-sm text-pretty text-muted-foreground">{a.excerpt}</p>
                <span className="mt-auto text-xs text-muted-foreground">
                  Updated {formatDistanceToNowStrict(new Date(a.updatedAt), { addSuffix: true })}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
