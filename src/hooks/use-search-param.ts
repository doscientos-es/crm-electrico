import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useDebounce } from './use-debounce'

/**
 * Search input backed by a URL query param.
 *
 * The input is driven by local state so typing stays responsive and no
 * keystrokes are dropped (binding the input directly to the async router
 * state loses characters when typing fast). The debounced value is synced
 * to the URL, and external URL changes (back/forward, reset) flow back in.
 */
export function useSearchParam(key = 'q', delay = 250) {
  const [params, setParams] = useSearchParams()
  const urlValue = params.get(key) ?? ''

  const [value, setValue] = useState(urlValue)
  const debounced = useDebounce(value, delay)

  const lastSynced = useRef(urlValue)
  const isFirst = useRef(true)

  // Debounced local value -> URL (skips the initial mount to preserve `page`).
  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false
      lastSynced.current = debounced
      return
    }
    lastSynced.current = debounced
    setParams(
      (p) => {
        const n = new URLSearchParams(p)
        if (debounced) n.set(key, debounced)
        else n.delete(key)
        n.delete('page')
        return n
      },
      { replace: true },
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced, key])

  // External URL changes -> local (ignores echoes of our own writes).
  useEffect(() => {
    if (urlValue !== lastSynced.current) {
      lastSynced.current = urlValue
      setValue(urlValue)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlValue])

  return { value, setValue, debounced }
}
