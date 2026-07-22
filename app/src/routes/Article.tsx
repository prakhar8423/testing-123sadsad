import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { format } from 'date-fns'
import { ArrowLeft, Eye, FileQuestion, ThumbsDown, ThumbsUp } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { EmptyState } from '@/components/page-header'
import { ToneBadge } from '@/components/tone-badge'
import { useData } from '@/lib/store'
import { useArticle, useArticles } from '@/data'
import { CATEGORY_LABEL } from '@/lib/itsm'

const RELATED_LIMIT = 3

export default function Article() {
  const { id } = useParams()
  const navigate = useNavigate()
  const article = useArticle(id)
  const articles = useArticles()
  const incrementViews = useData((s) => s.incrementViews)
  const articleFeedback = useData((s) => s.articleFeedback)
  const [voted, setVoted] = useState(false)
  const countedRef = useRef<string | null>(null)

  // Count a view once per article visit (external system: the view counter).
  useEffect(() => {
    if (id && countedRef.current !== id) {
      countedRef.current = id
      incrementViews(id)
    }
  }, [id, incrementViews])

  if (!article) {
    return (
      <EmptyState
        icon={FileQuestion}
        title="Article not found"
        description="This knowledge-base article doesn't exist or was removed."
        action={
          <Button variant="outline" onClick={() => navigate('/kb')}>
            Back to articles
          </Button>
        }
      />
    )
  }

  const related = articles
    .filter((a) => a.id !== article.id && a.category === article.category)
    .slice(0, RELATED_LIMIT)

  function handleVote(helpful: boolean) {
    if (voted) return
    articleFeedback(article!.id, helpful)
    setVoted(true)
    toast.success('Thanks for the feedback')
  }

  return (
    <div className="mx-auto max-w-3xl">
      <button
        type="button"
        onClick={() => navigate('/kb')}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> All articles
      </button>

      <div className="mb-3 flex items-center gap-3">
        <ToneBadge tone="neutral">{CATEGORY_LABEL[article.category]}</ToneBadge>
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Eye className="size-3.5" /> {article.views.toLocaleString()} views
        </span>
        <span className="text-xs text-muted-foreground">
          Updated {format(new Date(article.updatedAt), 'MMM d, yyyy')}
        </span>
      </div>

      <h1 className="font-heading text-3xl font-semibold tracking-tight text-balance">
        {article.title}
      </h1>

      <div className="mt-6 space-y-4 leading-relaxed">
        {article.body.map((para, i) => (
          <p key={i} className="text-pretty text-[0.95rem]">
            {para}
          </p>
        ))}
      </div>

      <Separator className="my-8" />

      <div className="flex flex-wrap items-center gap-3 rounded-md border border-border bg-card p-4">
        <span className="text-sm font-medium">Was this helpful?</span>
        <Button variant="outline" size="sm" onClick={() => handleVote(true)} disabled={voted}>
          <ThumbsUp className="size-4" /> Yes ({article.helpfulYes})
        </Button>
        <Button variant="outline" size="sm" onClick={() => handleVote(false)} disabled={voted}>
          <ThumbsDown className="size-4" /> No ({article.helpfulNo})
        </Button>
      </div>

      {related.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 font-heading text-base font-semibold">Related articles</h2>
          <ul className="space-y-2">
            {related.map((a) => (
              <li key={a.id}>
                <Link
                  to={`/kb/${a.id}`}
                  className="flex items-center justify-between rounded-md border border-border bg-card px-4 py-3 transition-colors hover:border-primary/40"
                >
                  <span className="text-sm font-medium">{a.title}</span>
                  <span className="text-xs text-muted-foreground">{a.excerpt.slice(0, 40)}…</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
