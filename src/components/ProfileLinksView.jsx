import { useEffect } from 'react'
import LinkCard from './LinkCard.jsx'

export function useReveal(dep) {
  useEffect(() => {
    const els = document.querySelectorAll('.reveal')
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add('is-visible')),
      { threshold: 0.12 }
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [dep])
}

// Komponen presentasional bersama untuk route edit + publik.
// Struktur, spacing, ukuran, dan kaca IDENTIK di keduanya;
// yang beda hanya slot opsional (fitur milik edit vs bersih milik publik).
// MOBILE: 1 kolom | DESKTOP: split kiri profil sticky + kanan grid links.
export default function ProfileLinksView({
  data,
  accent,
  variantId = '',
  profileExtra = null,
  linksTitle = 'Tautan saya',
  linksHint = 'Ketuk kartu untuk membuka ↗',
  emptyHint = 'Belum ada tautan aktif.',
  footer = null,
}) {
  const visibleLinks = (data.links || []).filter((l) => l.active)
  useReveal(visibleLinks.length + variantId)
  const initial = (data.profile?.name || 'A').trim().charAt(0).toUpperCase()

  return (
    <main className="mx-auto grid w-full max-w-6xl gap-6 px-5 pb-24 pt-6 md:grid-cols-[380px_1fr] md:items-start md:pt-10">
      {/* Profil */}
      <section className="glass rise mx-auto w-full max-w-md rounded-[28px] p-7 text-center md:sticky md:top-6 md:mx-0" style={{ animationDelay: '60ms' }}>
        <div className="relative mx-auto h-28 w-28">
          <div className="absolute -inset-2 rounded-[32px] opacity-70 blur-xl" style={{ background: `linear-gradient(135deg, ${accent}, transparent)` }} />
          {data.profile?.avatar
            ? <img src={data.profile.avatar} alt={data.profile?.name} className="relative h-28 w-28 rounded-[28px] object-cover ring-1 ring-white/30" />
            : <div className="font-display relative grid h-28 w-28 place-items-center rounded-[28px] bg-gradient-to-br from-white/25 to-white/5 text-5xl font-extrabold text-slate-50">{initial}</div>}
          <span className="absolute -bottom-1 -right-1 rounded-full bg-emerald-400 px-2 py-0.5 text-[11px] font-bold text-black ring-4 ring-black/40">● online</span>
        </div>
        <h1 className="font-display mt-5 text-2xl font-extrabold tracking-tight text-slate-50 md:text-3xl">{data.profile?.name || 'Namamu'}</h1>
        {data.profile?.bio && (
          <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-slate-300/80">{data.profile.bio}</p>
        )}
        {profileExtra}
      </section>

      {/* Links */}
      <section>
        <div className="rise mb-4 flex items-end justify-between" style={{ animationDelay: '140ms' }}>
          <h2 className="font-display text-lg font-bold text-slate-50">{linksTitle}</h2>
          {linksHint && <span className="text-xs text-slate-300/60">{linksHint}</span>}
        </div>
        {visibleLinks.length === 0 && (
          <div className="glass rounded-3xl p-8 text-center text-sm text-slate-300/80">{emptyHint}</div>
        )}
        <div className="grid gap-3.5 sm:grid-cols-2 md:grid-cols-2">
          {visibleLinks.map((l, i) => (
            <div key={l.id} className="reveal">
              <LinkCard link={l} index={i} accent={accent} />
            </div>
          ))}
        </div>
        {footer}
      </section>
    </main>
  )
}
