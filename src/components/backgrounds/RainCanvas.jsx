import { useCanvasScene, rand } from './fx.js'

// Hujan menenangkan: rintik miring halus, density sedang,
// GENANGAN 2-3x lipat di area bawah (elips memudar + pantulan cahaya samar),
// kabut bawah, vignette. Tetap tenang & ringan.
function build(w, h) {
  const count = Math.max(60, Math.min(170, Math.round((w * h) / 11000)))
  const drops = []
  for (let i = 0; i < count; i++) {
    drops.push({
      x: Math.random() * (w + 100),
      y: Math.random() * h,
      len: rand(9, 22),
      sp: rand(260, 520),
      o: rand(0.08, 0.3),
    })
  }
  // ripple 2-3x lipat, fokus area bawah
  const ripples = []
  for (let i = 0; i < 26; i++) {
    ripples.push({ x: Math.random() * w, y: rand(h * 0.5, h * 1.0), r: rand(2, 10), max: rand(18, 46), sp: rand(9, 20), o: rand(0.05, 0.13) })
  }
  // genangan statis: elips lembut + pantulan cahaya
  const puddles = []
  const n = Math.max(5, Math.min(8, Math.round(w / 220)))
  for (let i = 0; i < n; i++) {
    puddles.push({
      x: rand(w * 0.05, w * 0.95),
      y: rand(h * 0.68, h * 0.97),
      rx: rand(50, 130),
      ry: rand(9, 20),
      phase: rand(0, Math.PI * 2),
    })
  }
  return { drops, ripples, puddles, fogX: 0 }
}

const SLANT = 0.18 // kemiringan garis hujan

export default function RainCanvas() {
  const ref = useCanvasScene(
    (ctx, w, h, t, dt, assets) => {
      ctx.clearRect(0, 0, w, h)
      const { drops, ripples, puddles } = assets

      // genangan: elips lembut + pantulan cahaya samar berdenyut pelan
      for (const p of puddles) {
        const pulse = 0.7 + 0.3 * Math.sin(t * 0.4 + p.phase)
        ctx.globalAlpha = 0.07 * pulse
        ctx.fillStyle = '#9db8d8'
        ctx.beginPath()
        ctx.ellipse(p.x, p.y, p.rx, p.ry, 0, 0, Math.PI * 2)
        ctx.fill()
        // pantulan cahaya: sorot vertikal lembut di atas genangan
        const glow = ctx.createLinearGradient(0, p.y - p.ry * 7, 0, p.y)
        glow.addColorStop(0, 'rgba(174,194,224,0)')
        glow.addColorStop(1, `rgba(174,194,224,${(0.1 * pulse).toFixed(3)})`)
        ctx.globalAlpha = 1
        ctx.fillStyle = glow
        ctx.fillRect(p.x - p.rx * 0.5, p.y - p.ry * 7, p.rx, p.ry * 7)
        // garis tepi atas genangan (pantulan paling terang)
        ctx.globalAlpha = 0.16 * pulse
        ctx.strokeStyle = '#cfe0f5'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.ellipse(p.x, p.y - 1, p.rx * 0.92, p.ry * 0.7, 0, Math.PI * 1.05, Math.PI * 1.95)
        ctx.stroke()
      }
      ctx.globalAlpha = 1

      // ripple / tetesan samar (ramai di area bawah)
      for (const r of ripples) {
        r.r += r.sp * dt
        if (r.r >= r.max) {
          r.x = Math.random() * w
          r.y = rand(h * 0.5, h * 1.0)
          r.r = 2
        }
        const fade = 1 - r.r / r.max
        ctx.globalAlpha = r.o * fade
        ctx.strokeStyle = '#bcd3ee'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.ellipse(r.x, r.y, r.r, r.r * 0.38, 0, 0, Math.PI * 2)
        ctx.stroke()
        // cincin kedua yang mengikuti (kedalaman genangan)
        if (r.r > r.max * 0.35) {
          ctx.globalAlpha = r.o * fade * 0.5
          ctx.beginPath()
          ctx.ellipse(r.x, r.y, r.r * 0.55, r.r * 0.21, 0, 0, Math.PI * 2)
          ctx.stroke()
        }
      }
      ctx.globalAlpha = 1

      // hujan rintik miring
      ctx.lineWidth = 1
      ctx.lineCap = 'round'
      for (const d of drops) {
        d.y += d.sp * dt
        d.x += d.sp * SLANT * dt * 0.4
        if (d.y > h + 24) {
          d.y = -24
          d.x = Math.random() * (w + 100)
        }
        ctx.globalAlpha = d.o
        ctx.strokeStyle = '#aec2e0'
        ctx.beginPath()
        ctx.moveTo(d.x, d.y)
        ctx.lineTo(d.x - d.len * SLANT, d.y - d.len)
        ctx.stroke()
      }
      ctx.globalAlpha = 1

      // kabut bawah melayang pelan
      assets.fogX += dt * 12
      const fog = ctx.createLinearGradient(0, h * 0.55, 0, h)
      fog.addColorStop(0, 'rgba(148,163,184,0)')
      fog.addColorStop(1, 'rgba(148,163,184,0.16)')
      ctx.fillStyle = fog
      ctx.fillRect(0, h * 0.55, w, h * 0.45)
      ctx.globalAlpha = 0.05 + 0.02 * Math.sin(t * 0.3)
      ctx.fillStyle = '#cbd5e1'
      const off = assets.fogX % (w * 1.5)
      ctx.beginPath()
      ctx.ellipse(w * 0.3 - off * 0.3 + w * 0.3, h * 0.88, w * 0.45, h * 0.09, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.ellipse(w * 0.9 - off * 0.2, h * 0.94, w * 0.4, h * 0.08, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.globalAlpha = 1
    },
    build,
    []
  )
  return (
    <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg,#070d18 0%,#0a1220 50%,#16283f 100%)' }}>
      <canvas ref={ref} className="h-full w-full" />
      {/* vignette */}
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at center,transparent 45%,rgba(0,0,0,.55) 100%)' }} />
    </div>
  )
}
