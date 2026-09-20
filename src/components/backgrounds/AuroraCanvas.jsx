import { useCanvasScene, rand } from './fx.js'

// Aurora realistis: langit malam + 3 tirai berlapis (hijau-teal-ungu),
// drift lambat + shimmer halus, bintang redup, horizon glow.
const CURTAINS = [
  { top: 0.04, tall: 0.52, amp: 34, speed: 0.05, phase: 0.0, c1: '52,211,153', c2: '34,211,238', alpha: 0.5 },
  { top: 0.02, tall: 0.44, amp: 48, speed: 0.035, phase: 2.1, c1: '34,211,238', c2: '139,92,246', alpha: 0.42 },
  { top: 0.08, tall: 0.38, amp: 26, speed: 0.07, phase: 4.2, c1: '167,139,250', c2: '52,211,153', alpha: 0.34 },
]

function build(w, h) {
  const stars = []
  const n = Math.round(Math.min(140, (w * h) / 14000))
  for (let i = 0; i < n; i++) {
    stars.push({ x: Math.random() * w, y: Math.random() * h * 0.85, r: rand(0.4, 1.3), p: rand(0, Math.PI * 2), f: rand(0.4, 1.4) })
  }
  return { stars }
}

function drawCurtain(ctx, w, h, t, c) {
  const step = Math.max(10, w / 90)
  ctx.beginPath()
  ctx.moveTo(-20, h + 20)
  for (let x = -20; x <= w + 20; x += step) {
    const y =
      c.top * h +
      Math.sin(x * 0.004 + t * c.speed * 4 + c.phase) * c.amp +
      Math.sin(x * 0.011 - t * 0.12 + c.phase * 2) * c.amp * 0.35
    ctx.lineTo(x, y)
  }
  for (let x = w + 20; x >= -20; x -= step) {
    const yTop =
      c.top * h +
      Math.sin(x * 0.004 + t * c.speed * 4 + c.phase) * c.amp +
      Math.sin(x * 0.011 - t * 0.12 + c.phase * 2) * c.amp * 0.35
    ctx.lineTo(x, yTop + c.tall * h)
  }
  ctx.closePath()
  const g = ctx.createLinearGradient(0, c.top * h - c.amp, 0, (c.top + c.tall) * h + c.amp)
  const shimmer = 0.85 + 0.15 * Math.sin(t * 0.6 + c.phase)
  g.addColorStop(0, `rgba(${c.c1},0)`)
  g.addColorStop(0.45, `rgba(${c.c1},${(c.alpha * 0.55 * shimmer).toFixed(3)})`)
  g.addColorStop(0.75, `rgba(${c.c2},${(c.alpha * shimmer).toFixed(3)})`)
  g.addColorStop(1, `rgba(${c.c2},0)`)
  ctx.fillStyle = g
  ctx.fill()
}

export default function AuroraCanvas() {
  const ref = useCanvasScene(
    (ctx, w, h, t, dt, assets) => {
      ctx.clearRect(0, 0, w, h)
      // bintang redup berkelip halus
      for (const s of assets.stars) {
        const a = 0.25 + 0.35 * (0.5 + 0.5 * Math.sin(t * s.f + s.p))
        ctx.globalAlpha = a
        ctx.fillStyle = '#dbeafe'
        ctx.beginPath()
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1
      // tirai aurora berlapis
      ctx.globalCompositeOperation = 'lighter'
      for (const c of CURTAINS) drawCurtain(ctx, w, h, t, c)
      ctx.globalCompositeOperation = 'source-over'
      // horizon glow
      const pulse = 0.5 + 0.08 * Math.sin(t * 0.25)
      const hg = ctx.createRadialGradient(w * 0.5, h * 1.02, 0, w * 0.5, h * 1.02, w * 0.7)
      hg.addColorStop(0, `rgba(45,212,191,${(0.28 * pulse).toFixed(3)})`)
      hg.addColorStop(0.5, `rgba(139,92,246,${(0.12 * pulse).toFixed(3)})`)
      hg.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = hg
      ctx.fillRect(0, 0, w, h)
    },
    build,
    []
  )
  return (
    <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg,#01040d 0%,#020a18 45%,#04121f 75%,#020610 100%)' }}>
      <canvas ref={ref} className="h-full w-full" />
    </div>
  )
}
