// Data layer — all data-access hooks for the Fieldpost service desk.
// This app persists locally (zustand + localStorage); components import these
// hooks from '@/data' rather than reading the store directly.
export * from '@/data/people'
export * from '@/data/tickets'
export * from '@/data/analytics'
export * from '@/data/content'
