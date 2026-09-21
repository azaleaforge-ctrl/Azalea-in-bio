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
    <main className="mx-auto grid w-full max-w-6xl min-w-0 justify-items-center gap-6 overflow-x-clip px-4 pb-24 pt-6 sm:px-5 md:justify-items-stretch md:grid-cols-[380px_1fr] md:items-start md:pt-10">
      {/* Profil — ukuran dikunci: tidak grow/shrink, lebar penuh terkontrol */}
      <section className="glass rise mx-auto w-full max-w-full min-w-0 shrink-0 grow-0 overflow-hidden rounded-3xl p-5 text-center sm:max-w-md sm:p-6 md:sticky md:top-6 md:mx-0 md:p-7 md:rounded-[28px]" style={{ animationDelay: '60ms', flex: 'none' }}>
        <div className="relative mx-auto h-20 w-20 md:h-28 md:w-28">
          <div className="absolute -inset-1.5 rounded-[24px] opacity-70 blur-xl md:-inset-2 md:rounded-[32px]" style={{ background: `linear-gradient(135deg, ${accent}, transparent)` }} />
          {data.profile?.avatar
            ? <img src={data.profile.avatar} alt={data.profile?.name} className="relative h-20 w-20 rounded-[22px] object-cover ring-1 ring-white/30 md:h-28 md:w-28 md:rounded-[28px]" />
            : <div className="font-display relative grid h-20 w-20 place-items-center rounded-[22px] bg-gradient-to-br from-white/25 to-white/5 text-4xl font-extrabold text-slate-50 md:h-28 md:w-28 md:rounded-[28px] md:text-5xl">{initial}</div>}
          <span className="absolute -bottom-1 -right-1 max-w-full truncate rounded-full bg-emerald-400 px-2 py-0.5 text-[10px] font-bold text-black ring-4 ring-black/40 md:text-[11px]">● online</span>
        </div>
        <h1 className="font-display mt-4 max-w-full break-words text-xl font-extrabold tracking-tight text-slate-50 [overflow-wrap:anywhere] sm:text-2xl md:mt-5 md:text-3xl">{data.profile?.name || 'Namamu'}</h1>
        {data.profile?.bio && (
          <p className="mx-auto mt-2 max-w-full break-words text-[13px] leading-relaxed text-slate-300/80 [overflow-wrap:anywhere] sm:max-w-xs md:text-sm">{data.profile.bio}</p>
        )}
        {profileExtra}
      </section>

      {/* Links — tetap center di mobile, penuh di desktop */}
      <section className="mx-auto w-full max-w-full min-w-0 sm:max-w-md md:mx-0 md:max-w-none">
        <div className="rise mb-4 flex min-w-0 items-end justify-between gap-2" style={{ animationDelay: '140ms' }}>
          <h2 className="font-display min-w-0 text-lg font-bold text-slate-50">{linksTitle}</h2>
          {linksHint && <span className="shrink-0 text-right text-xs text-slate-300/60">{linksHint}</span>}
        </div>
        {visibleLinks.length === 0 && (
          <div className="glass mx-auto w-full max-w-full min-w-0 overflow-hidden break-words rounded-3xl p-6 text-center text-sm text-slate-300/80 sm:p-8">{emptyHint}</div>
        )}
        <div className="grid w-full max-w-full min-w-0 justify-items-center gap-3 sm:gap-3.5 sm:grid-cols-2 sm:justify-items-stretch md:grid-cols-2">
          {visibleLinks.map((l, i) => (
            <div key={l.id} className="reveal mx-auto w-full max-w-full min-w-0">
              <LinkCard link={l} index={i} accent={accent} />
            </div>
          ))}
        </div>
        {footer}
      </section>
    </main>
  )
}
