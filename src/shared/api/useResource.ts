import { useCallback, useEffect, useRef, useState } from 'react'
import { toastError } from './errors'

/**
 * Loads something from the backend when the page opens and whenever `key` changes (the filters),
 * and again on `reload()`. A failure shows a red toast and leaves `data` as it was; while a new
 * answer is on its way `data` is still the previous one.
 */
export function useResource<T>(load: () => Promise<T>, key: string) {
  const loadRef = useRef(load)
  useEffect(() => {
    loadRef.current = load
  })
  const [tick, setTick] = useState(0)
  const [result, setResult] = useState<{ key: string; data?: T }>()
  const current = `${key}#${tick}`

  useEffect(() => {
    let alive = true
    loadRef
      .current()
      .then((data) => alive && setResult({ key: current, data }))
      .catch((e) => {
        if (!alive) return
        toastError(e)
        setResult((previous) => ({ key: current, data: previous?.data }))
      })
    return () => {
      alive = false
    }
  }, [current])

  const reload = useCallback(() => setTick((n) => n + 1), [])
  return { data: result?.data, loading: result?.key !== current, reload }
}
