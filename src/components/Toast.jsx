import { useCallback, useEffect, useRef, useState } from 'react'

export function toast(message, type = 'success') {
  window.dispatchEvent(new CustomEvent('azalea:toast', { detail: { message, type, id: Date.now() + Math.random() } }))
}

export function Toaster() {
  const [queue, setQueue] = useState([])
  const [current, setCurrent] = useState(null)
  const [leaving, setLeaving] = useState(false)
  const timers = useRef([])

  const clearTimers = () => {
    timers.current.forEach((t) => clearTimeout(t))
    timers.current = []
  }

  useEffect(() => {
    function onToast(e) {
      const item = e.detail
      if (!item?.message) return
      setQueue((q) => [...q.slice(-2), item])
    }
    window.addEventListener('azalea:toast', onToast)
    return () => window.removeEventListener('azalea:toast', onToast)
  }, [])

  useEffect(() => {
    if (current || queue.length === 0) return
    const [next, ...rest] = queue
    setQueue(rest)
    setCurrent(next)
    setLeaving(false)
  }, [queue, current])

  const dismiss = useCallback(() => {
    setLeaving(true)
    const t = setTimeout(() => {
      setCurrent(null)
      setLeaving(false)
    }, 250)
    timers.current.push(t)
  }, [])

  useEffect(() => {
    if (!current) return
    clearTimers()
    const t = setTimeout(() => dismiss(), 2200)
    timers.current.push(t)
    return clearTimers
  }, [current, dismiss])

  if (!current) return null

  const isError = current.type === 'error'

  return (
    <div className="toast-root" role="status" aria-live="polite">
      <div className={`toast-pill glass ${leaving ? 'toast-out' : 'toast-in'}`}>
        <span className={`toast-icon ${isError ? 'toast-icon-error' : ''}`} aria-hidden="true">
          {isError ? '!' : '✓'}
        </span>
        <span className="toast-msg">{current.message}</span>
      </div>
    </div>
  )
}
