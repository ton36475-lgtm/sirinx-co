import { useState, useEffect, useCallback, useRef } from 'react'
import { ApiClientError } from '@/api/client'

interface ApiState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

/**
 * Generic hook for async API calls.
 * Runs `fetcher` immediately on mount (or when deps change).
 * Returns `data`, `loading`, `error`, and a `refetch` function.
 */
export function useApi<T>(
  fetcher: () => Promise<T>,
  deps: unknown[] = [],
): ApiState<T> & { refetch: () => void } {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: true,
    error: null,
  })
  const fetcherRef = useRef(fetcher)
  fetcherRef.current = fetcher

  const abortRef = useRef<AbortController | null>(null)

  const run = useCallback(() => {
    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl

    setState((s) => ({ ...s, loading: true, error: null }))

    fetcherRef
      .current()
      .then((data) => {
        if (ctrl.signal.aborted) return
        setState({ data, loading: false, error: null })
      })
      .catch((err: unknown) => {
        if (ctrl.signal.aborted) return
        let msg = 'Unknown error'
        if (err instanceof ApiClientError) {
          msg = err.body.detail ?? err.body.error ?? err.message
        } else if (err instanceof Error) {
          msg = err.message
        }
        setState((s) => ({ ...s, loading: false, error: msg }))
      })

    return () => ctrl.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(() => {
    const cleanup = run()
    return cleanup
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run])

  return { ...state, refetch: run }
}

/**
 * Imperative mutation hook — does NOT auto-run.
 * Use for POST / PATCH / DELETE operations.
 */
export function useMutation<TData, TVariables = void>(
  mutationFn: (vars: TVariables) => Promise<TData>,
): {
  mutate: (vars: TVariables) => Promise<TData>
  loading: boolean
  error: string | null
  data: TData | null
  reset: () => void
} {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<TData | null>(null)

  const mutate = useCallback(
    async (vars: TVariables): Promise<TData> => {
      setLoading(true)
      setError(null)
      try {
        const result = await mutationFn(vars)
        setData(result)
        return result
      } catch (err: unknown) {
        let msg = 'Unknown error'
        if (err instanceof ApiClientError) {
          msg = err.body.detail ?? err.body.error ?? err.message
        } else if (err instanceof Error) {
          msg = err.message
        }
        setError(msg)
        throw err
      } finally {
        setLoading(false)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mutationFn],
  )

  const reset = useCallback(() => {
    setLoading(false)
    setError(null)
    setData(null)
  }, [])

  return { mutate, loading, error, data, reset }
}
