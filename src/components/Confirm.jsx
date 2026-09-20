import { useEffect, useRef } from 'react'

export default function ConfirmDialog({ open, title, message, confirmLabel = 'Ya, hapus', cancelLabel = 'Batal', onConfirm, onCancel }) {
  const cancelRef = useRef(null)
  const prevFocus = useRef(null)

  useEffect(() => {
    if (!open) return
    prevFocus.current = document.activeElement
    const t = setTimeout(() => cancelRef.current?.focus(), 30)
    function onKey(e) {
      if (e.key === 'Escape') onCancel?.()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      clearTimeout(t)
      prevFocus.current?.focus?.()
    }
  }, [open, onCancel])

  if (!open) return null

  return (
    <div className="confirm-root">
      <div
        className="confirm-overlay"
        onClick={onCancel}
        aria-hidden="true"
      />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-label={title}
        aria-describedby="confirm-desc"
        className="confirm-card glass confirm-in"
      >
        <h3 className="font-display text-base font-bold text-slate-50">{title}</h3>
        <p id="confirm-desc" className="mt-1.5 text-sm leading-relaxed text-slate-300/80">{message}</p>
        <div className="mt-4 flex justify-end gap-2">
          <button
            ref={cancelRef}
            onClick={onCancel}
            className="rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold text-slate-100 ring-1 ring-white/15 hover:bg-white/20 active:scale-95"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className="rounded-xl bg-red-500 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-red-500/30 hover:bg-red-400 active:scale-95"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
