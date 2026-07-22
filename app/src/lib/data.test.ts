import { test, expect } from 'bun:test'
import { useData } from './data'

test('useData seed returns the inline list data', () => {
  const r = useData<Array<{ id: string }>>('products', 'seed', [{ id: 'p1' }, { id: 'p2' }])
  expect(r.data).toEqual([{ id: 'p1' }, { id: 'p2' }])
  expect(r.loading).toBe(false)
  expect(r.error).toBeUndefined()
  expect(typeof r.refetch).toBe('function')
})

test('useData seed returns inline scalar data', () => {
  const r = useData<{ total: number }>('summary', 'seed', { total: 7 })
  expect(r.data).toEqual({ total: 7 })
})

test('useData returns undefined data for not-yet-supported kinds', () => {
  const r = useData('orders', 'storage', { id: 'e_x' })
  expect(r.data).toBeUndefined()
  expect(r.loading).toBe(false)
})
