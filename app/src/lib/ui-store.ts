import { create } from 'zustand'
import type { Category, Priority, Status } from '@/lib/itsm'

export type QueueScope = 'all' | 'mine' | 'unassigned' | 'at_risk'

interface UiState {
  sidebarCollapsed: boolean
  toggleSidebar: () => void

  // queue filters
  search: string
  scope: QueueScope
  statusFilter: Status | 'all'
  priorityFilter: Priority | 'all'
  categoryFilter: Category | 'all'
  sortKey: string
  sortDir: 'asc' | 'desc'
  selectedIds: string[]

  setSearch: (v: string) => void
  setScope: (v: QueueScope) => void
  setStatusFilter: (v: Status | 'all') => void
  setPriorityFilter: (v: Priority | 'all') => void
  setCategoryFilter: (v: Category | 'all') => void
  setSort: (key: string) => void
  toggleSelected: (id: string) => void
  setSelected: (ids: string[]) => void
  clearSelected: () => void
  clearFilters: () => void
}

export const useUiStore = create<UiState>((set) => ({
  sidebarCollapsed: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

  search: '',
  scope: 'all',
  statusFilter: 'all',
  priorityFilter: 'all',
  categoryFilter: 'all',
  sortKey: 'updatedAt',
  sortDir: 'desc',
  selectedIds: [],

  setSearch: (v) => set({ search: v }),
  setScope: (v) => set({ scope: v, selectedIds: [] }),
  setStatusFilter: (v) => set({ statusFilter: v, selectedIds: [] }),
  setPriorityFilter: (v) => set({ priorityFilter: v, selectedIds: [] }),
  setCategoryFilter: (v) => set({ categoryFilter: v, selectedIds: [] }),
  setSort: (key) =>
    set((s) =>
      s.sortKey === key
        ? { sortDir: s.sortDir === 'asc' ? 'desc' : 'asc' }
        : { sortKey: key, sortDir: 'asc' },
    ),
  toggleSelected: (id) =>
    set((s) => ({
      selectedIds: s.selectedIds.includes(id)
        ? s.selectedIds.filter((x) => x !== id)
        : [...s.selectedIds, id],
    })),
  setSelected: (ids) => set({ selectedIds: ids }),
  clearSelected: () => set({ selectedIds: [] }),
  clearFilters: () =>
    set({
      search: '',
      scope: 'all',
      statusFilter: 'all',
      priorityFilter: 'all',
      categoryFilter: 'all',
      selectedIds: [],
    }),
}))
