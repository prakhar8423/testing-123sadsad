import { useData } from '@/lib/store'
import type { Article, CatalogItem } from '@/lib/itsm'

export function useCatalog(): CatalogItem[] {
  return useData((s) => s.catalog)
}

export function useArticles(): Article[] {
  return useData((s) => s.articles)
}

export function useArticle(id: string | undefined): Article | undefined {
  const articles = useArticles()
  return articles.find((a) => a.id === id)
}
