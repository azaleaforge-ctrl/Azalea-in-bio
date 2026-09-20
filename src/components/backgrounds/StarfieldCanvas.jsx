import { useCanvasScene, rand } from './fx.js'

// Starfield parallax 2-3 layer: twinkle sinusoidal beda fase,
// drift horizontal super lambat, sesekali shooting star halus.
const LAYERS = [
  { n: 90, size: [0.4, 0.9], speed: 2, base: 0.35, amp: 0.3 },
  { n: 55, size: [0.7, 1.4], speed: 6, base: 0.5, amp: 0.35 },
  { n: 30, size: [1.1, 2.1], speed: 14, base: 0.65, amp: 0.35 },
]

function build(w, h) {
  const scale = Math.min(1.4, Math.max(0.6, (w * h) / 900000))
  const layers = LAYERS.map((L) => {
    const stars = []
    const n = Math.round(L.n * scale)
    for (let i = 0; i < n; i++) {
      stars.push({ x: Math.random() * w, y: Math.random() * h, r: rand(L.size[0], L.size[1]), p: rand(0, Math.PI * 2), f: rand(0.5, 2) })
    }
    return { ...L, stars }
  })
  return { layers, meteor: null, nextMeteor: rand(2.5, 6) }
}

export default function StarfieldCanvas() {
  const ref = useCanvasScene(
    (ctx, w, h, t, dt, assets) => {
      ctx.clearRect(0, 0, w, h)
      for (const L of assets.layers) {
        for (const s of L.stars) {
          s.x -= L.speed * dt
          if (s.x < -4) {
            s.x = w + 4
            s.y = Math.random() * h
          }
          const a = L.base + L.amp * Math.sin(t * s.f + s.p)
          ctx.globalAlpha = Math.max(0.05, Math.min(1, a))
          ctx.fillStyle = '#e8f0ff'
          ctx.beginPath()
          ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
          ctx.fill()
        }
      }
      ctx.globalAlpha = 1

      // shooting star sesekali
      assets.nextMeteor -= dt
      if (!assets.meteor && assets.nextMeteor <= 0) {
        const sx = rand(w * 0.3, w * 1.05)
        assets.meteor = { x: sx, y: rand(0, h * 0.35), vx: -rand(380, 620), vy: rand(140, 220), life: 0, max: rand(0.7, 1.1) }
      }
      const m = assets.meteor
      if (m) {
        m.life += dt
        m.x += m.vx * dt
        m.y += m.vy * dt
        const k = 1 - m.life / m.max
        if (k <= 0 || m.x < -200) {
          assets.meteor = null
          assets.nextMeteor = rand(3.5, 8)
        } else {
          const tail = 130 * k
          const nx = m.x - m.vx * 0.001
          const ny = m.y - m.vy * 0.001
          const len = Math.hypot(m.vx, m.vy)
          const tx = m.x - (m.vx / len) * tail
          const ty = m.y - (m.vy / len) * tail
          const g = ctx.createLinearGradient(m.x, m.y, tx, ty)
          g.addColorStop(0, `rgba(255,255,255,${(0.9 * k).toFixed(3)})`)
          g.addColorStop(1, 'rgba(255,255,255,0)')
          ctx.globalAlpha = 1
          ctx.strokeStyle = g
          ctx.lineWidth = 1.6
          ctx.lineCap = 'round'
          ctx.beginPath()
          ctx.moveTo(m.x, m.y)
          ctx.lineTo(tx, ty)
          ctx.stroke()
          void nx
          void ny
        }
      }
    },
    build,
    []
  )
  return (
    <div
      className="absolute inset-0"
      style={{
        background:
          'radial-gradient(circle at 72% 18%,rgba(76,29,149,.5) 0%,transparent 46%),radial-gradient(circle at 18% 82%,rgba(14,116,144,.35) 0%,transparent 42%),linear-gradient(180deg,#02020a 0%,#030014 60%,#06021c 100%)',
      }}
    >
      <canvas ref={ref} className="h-full w-full" />
    </div>
  )
}
