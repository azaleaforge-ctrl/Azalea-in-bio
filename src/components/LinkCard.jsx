import { useRef, useState } from 'react'
import { BrandIcon, brandLabel, resolveLinkBrand } from './icons/brandIcons.jsx'

export default function LinkCard({ link, index, accent }) {
  const ref = useRef(null)
  const [ripples, setRipples] = useState([])
  const brand = resolveLinkBrand(link)

  function onMove(e) {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width - 0.5
    const py = (e.clientY - r.top) / r.height - 0.5
    // tilt + magnetik ringan
    el.style.transform = `perspective(700px) rotateX(${(-py * 10).toFixed(2)}deg) rotateY(${(px * 12).toFixed(2)}deg) translate(${px * 6}px, ${py * 6}px) scale(1.02)`
  }

  function onLeave() {
    if (ref.current) ref.current.style.transform = ''
  }

  function onClick(e) {
    const el = ref.current
    const r = el.getBoundingClientRect()
    const id = Date.now()
    const size = Math.max(r.width, r.height)
    setRipples((s) => [...s, { id, x: e.clientX - r.left, y: e.clientY - r.top, size }])
    setTimeout(() => setRipples((s) => s.filter((x) => x.id !== id)), 650)
  }

  return (
    <a
      ref={ref}
      href={link.url}
      target="_blank"
      rel="noreferrer"
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      onClick={onClick}
      style={{ '--accent': accent, animationDelay: `${index * 90}ms`, flex: 'none' }}
      className="link-card ripple-wrap rise glass group mx-auto flex w-full max-w-full min-w-0 flex-none shrink-0 grow-0 items-center gap-3 overflow-hidden break-words rounded-2xl px-4 py-3 active:scale-[.97] sm:gap-4 sm:px-5 sm:py-4"
    >
      <span
        className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-xl transition-transform duration-300 group-hover:scale-110 sm:h-12 sm:w-12"
        style={{ background: 'linear-gradient(135deg,rgba(255,255,255,.14),rgba(255,255,255,.04))', boxShadow: `inset 0 1px 0 rgba(255,255,255,.25), 0 6px 18px -8px ${accent}` }}
      >
        {link.iconUrl ? (
          <img src={link.iconUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <span style={{ color: accent }}>
            <BrandIcon brand={brand} className="h-6 w-6" />
          </span>
        )}
      </span>
      <span className="w-full max-w-full min-w-0 flex-1 overflow-hidden">
        <span className="font-display block truncate text-sm font-bold tracking-tight text-slate-50 sm:text-[15px]">{link.title}</span>
        <span className="block truncate text-xs text-slate-300/70">{brand ? brandLabel(brand) : hostOf(link.url)} · {hostOf(link.url)}</span>
      </span>
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/10 text-base text-slate-100 ring-1 ring-white/15 transition-all duration-300 group-hover:translate-x-1 group-hover:bg-white/20 sm:h-9 sm:w-9 sm:text-lg">→</span>
      {ripples.map((rp) => (
        <span key={rp.id} className="ripple-dot" style={{ left: rp.x, top: rp.y, width: rp.size, height: rp.size }} />
      ))}
    </a>
  )
}

function hostOf(url) {
  try {
    return new URL(url).hostname.replace('www.', '')
  } catch {
    return url
  }
}
