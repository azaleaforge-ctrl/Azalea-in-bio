import { useEffect, useRef } from 'react'

// Parallax bersama (halaman edit + publik): nilai di-clamp ±1 agar
// translasi tak pernah melebihi bleed lapisan (tepi tak tersingkap).
export function updateParallax(clientX, clientY) {
  const x = Math.max(-1, Math.min(1, (clientX / window.innerWidth - 0.5) * 2))
  const y = Math.max(-1, Math.min(1, (clientY / window.innerHeight - 0.5) * 2))
  document.documentElement.style.setProperty('--mx', x.toFixed(3))
  document.documentElement.style.setProperty('--my', y.toFixed(3))
}

// Helper bersama: DPR cap 1.5, rAF, pause saat tab hidden,
// hormati prefers-reduced-motion (render 1 frame statis).
export function useCanvasScene(draw, buildAssets, deps = []) {
  const ref = useRef(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let assets = null
    let raf = 0
    let last = 0
    let running = true
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
      const w = canvas.clientWidth || window.innerWidth
      const h = canvas.clientHeight || window.innerHeight
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      assets = buildAssets(w, h)
    }

    function frame(now) {
      if (!running) return
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now
      draw(ctx, canvas.clientWidth || window.innerWidth, canvas.clientHeight || window.innerHeight, now / 1000, dt, assets)
      raf = requestAnimationFrame(frame)
    }

    function start() {
      if (!running || reduced) return
      last = performance.now()
      raf = requestAnimationFrame(frame)
    }
    function stop() {
      running = false
      cancelAnimationFrame(raf)
    }
    function onVis() {
      if (document.hidden) {
        cancelAnimationFrame(raf)
      } else if (running && !reduced) {
        start()
      }
    }

    resize()
    if (reduced) {
      // satu frame statis yang tetap cantik
      draw(ctx, canvas.clientWidth || window.innerWidth, canvas.clientHeight || window.innerHeight, 8, 0, assets)
    } else {
      start()
    }
    window.addEventListener('resize', resize)
    // Ikuti address-bar mobile (visual viewport berubah tanpa resize window)
    const vv = window.visualViewport
    vv?.addEventListener('resize', resize)
    document.addEventListener('visibilitychange', onVis)
    return () => {
      stop()
      window.removeEventListener('resize', resize)
      vv?.removeEventListener('resize', resize)
      document.removeEventListener('visibilitychange', onVis)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return ref
}

export function rand(a, b) {
  return a + Math.random() * (b - a)
}
