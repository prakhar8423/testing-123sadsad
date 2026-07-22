export type BindingKind = 'seed' | 'storage' | 'callable'

export interface UseDataResult<T> {
  data: T | undefined
  loading: boolean
  error: unknown
  refetch: () => void
}

const NOOP = () => {}

// The one convention the generator calls. The binding lives INLINE in the call:
//
//   const { data: products } = useData('products', 'seed', [ ... ])
//
// For 'seed', the third argument IS the data — returned as-is, no fetch.
// 'storage'/'callable' name a platform-attached source; their runtime is added
// later (the user attaches them from the platform panel), so for now they
// resolve to undefined. `id` is the stable key the property panel / extractor
// use to locate this binding; it is not needed at runtime for seed data.
export function useData<T>(id: string, kind: 'seed', seed: T): UseDataResult<T>
export function useData<T>(id: string, kind: BindingKind, config: unknown): UseDataResult<T>
export function useData<T>(
  _id: string,
  kind: BindingKind,
  config: unknown,
): UseDataResult<T> {
  if (kind === 'seed') {
    return { data: config as T, loading: false, error: undefined, refetch: NOOP }
  }
  return { data: undefined, loading: false, error: undefined, refetch: NOOP }
}
