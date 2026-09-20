import { useEffect, useRef, useState } from 'react'
import { BG_VARIANTS } from '../data/defaults.js'
import { BRANDS, BrandIcon, detectBrand } from './icons/brandIcons.jsx'
import { prettyUrlWithData, slugify, copyText } from '../lib/publish.js'

const ACCENTS = ['#22d3ee', '#f472b6', '#a3e635', '#facc15', '#8b5cf6', '#fb923c']

export default function EditPanel({ data, setData, onExport, onImportFile, onReset, onClose }) {
  const fileAvatar = useRef(null)
  const fileImport = useRef(null)

  // Tutup panel dengan tombol Escape
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function patchProfile(p) {
    setData((d) => ({ ...d, profile: { ...d.profile, ...p } }))
  }
  function patchTheme(p) {
    setData((d) => ({ ...d, theme: { ...d.theme, mode: 'dark', ...p } }))
  }

  function updateLink(id, p) {
    setData((d) => ({ ...d, links: d.links.map((l) => (l.id === id ? { ...l, ...p } : l)) }))
  }
  function removeLink(id) {
    setData((d) => ({ ...d, links: d.links.filter((l) => l.id !== id) }))
  }
  function moveLink(id, dir) {
    setData((d) => {
      const i = d.links.findIndex((l) => l.id === id)
      const j = i + dir
      if (i < 0 || j < 0 || j >= d.links.length) return d
      const arr = [...d.links]
      ;[arr[i], arr[j]] = [arr[j], arr[i]]
      return { ...d, links: arr }
    })
  }
  function addLink() {
    const id = 'link-' + Date.now().toString(36)
    setData((d) => ({ ...d, links: [...d.links, { id, title: 'Link baru', url: 'https://', brand: 'auto', active: true }] }))
  }

  function onAvatarFile(f) {
    if (!f) return
    const reader = new FileReader()
    reader.onload = () => patchProfile({ avatar: String(reader.result) })
    reader.readAsDataURL(f)
  }

  function onLinkIconFile(id, f) {
    if (!f) return
    const reader = new FileReader()
    reader.onload = () => updateLink(id, { iconUrl: String(reader.result) })
    reader.readAsDataURL(f)
  }

  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      {/* Mobile: bottom-sheet full-width | Desktop (md+): drawer menempel KANAN.
          PENTING: jangan pakai inset-x-0 di sini — di Tailwind v4 itu memakai
          properti logis inset-inline yang MENANG atas left-auto fisik,
          sehingga drawer nyangkut di kiri. Pakai left/right fisik eksplisit. */}
      <aside data-drawer="right" className="edit-drawer glass fixed right-0 top-0 h-full w-[430px] max-w-full overflow-y-auto rounded-l-3xl p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg font-bold text-slate-50">Mode Edit ✎</h2>
            <p className="text-xs text-slate-300/70">Otomatis tersimpan di browser ini.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} aria-label="Tutup panel" className="rounded-full bg-white/10 px-3 py-2 text-sm font-bold text-slate-100 ring-1 ring-white/15 hover:bg-white/20 active:scale-95">✕</button>
            <button onClick={onClose} className="rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-slate-100 ring-1 ring-white/15 hover:bg-white/20 active:scale-95">Selesai</button>
          </div>
        </div>

        {/* Profil */}
        <section className="rounded-2xl bg-black/30 p-4 ring-1 ring-white/10">
          <h3 className="font-display mb-3 text-sm font-bold uppercase tracking-widest text-slate-300/70">Profil</h3>
          <div className="flex items-center gap-3">
            <AvatarPreview avatar={data.profile.avatar} name={data.profile.name} />
            <div className="flex flex-1 flex-col gap-2">
              <button onClick={() => fileAvatar.current?.click()} className="rounded-xl bg-white/10 px-3 py-2 text-xs font-bold text-slate-100 ring-1 ring-white/10 hover:bg-white/20 active:scale-95">Upload foto</button>
              <input ref={fileAvatar} type="file" accept="image/*" hidden onChange={(e) => onAvatarFile(e.target.files?.[0])} />
              <input
                value={data.profile.avatar?.startsWith('data:') ? '' : data.profile.avatar || ''}
                onChange={(e) => patchProfile({ avatar: e.target.value })}
                placeholder="…atau tempel URL foto"
                className="w-full rounded-xl bg-black/40 px-3 py-2 text-xs text-slate-100 outline-none ring-1 ring-white/10 placeholder:text-slate-400 focus:ring-2 focus:ring-white/30"
              />
            </div>
          </div>
          <label className="mt-3 block text-xs font-semibold text-slate-300/70">Nama</label>
          <input value={data.profile.name} onChange={(e) => patchProfile({ name: e.target.value })} className="mt-1 w-full rounded-xl bg-black/40 px-3 py-2 text-sm text-slate-100 outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-white/30" />
          <label className="mt-3 block text-xs font-semibold text-slate-300/70">Bio</label>
          <textarea value={data.profile.bio} onChange={(e) => patchProfile({ bio: e.target.value })} rows={3} className="mt-1 w-full rounded-xl bg-black/40 px-3 py-2 text-sm text-slate-100 outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-white/30" />
        </section>

        <PublishSection data={data} />

        {/* Background */}
        <section className="mt-4 rounded-2xl bg-black/30 p-4 ring-1 ring-white/10">
          <h3 className="font-display mb-1 text-sm font-bold uppercase tracking-widest text-slate-300/70">Background Premium</h3>
          <p className="mb-3 text-[11px] text-slate-300/60">3 template canvas ringan — tambah varian baru di <code>src/data/defaults.js</code> + <code>src/components/backgrounds/</code>.</p>
          <div className="grid gap-2">
            {BG_VARIANTS.map((v) => (
              <button
                key={v.id}
                onClick={() => patchTheme({ bgVariant: v.id })}
                className={`flex items-center gap-3 rounded-2xl border-2 p-2 text-left transition active:scale-[.98] ${data.theme.bgVariant === v.id ? 'border-white' : 'border-transparent opacity-80 hover:opacity-100'}`}
                style={{ background: v.preview }}
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-black/40 text-xl backdrop-blur">{v.icon}</span>
                <span>
                  <span className="block text-xs font-bold text-white drop-shadow">{v.label}</span>
                  <span className="block text-[10px] text-white/90 drop-shadow">{v.desc}</span>
                </span>
                {data.theme.bgVariant === v.id && <span className="ml-auto pr-1 text-sm text-white">✓</span>}
              </button>
            ))}
          </div>
          <h4 className="mb-2 mt-4 text-xs font-bold text-slate-300/70">Warna aksen</h4>
          <div className="flex gap-2">
            {ACCENTS.map((c) => (
              <button key={c} onClick={() => patchTheme({ accent: c })} aria-label={c} className={`h-8 w-8 rounded-full transition active:scale-90 ${data.theme.accent === c ? 'ring-2 ring-white ring-offset-2 ring-offset-transparent' : 'ring-1 ring-white/20'}`} style={{ background: c }} />
            ))}
          </div>
        </section>

        {/* Links */}
        <section className="mt-4 rounded-2xl bg-black/30 p-4 ring-1 ring-white/10">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-display text-sm font-bold uppercase tracking-widest text-slate-300/70">Tautan ({data.links.length})</h3>
            <button onClick={addLink} className="rounded-xl bg-white/10 px-3 py-1.5 text-xs font-bold text-slate-100 ring-1 ring-white/15 hover:bg-white/20 active:scale-95">+ Tambah</button>
          </div>
          <div className="space-y-3">
            {data.links.map((l) => (
              <LinkEditor key={l.id} link={l} updateLink={updateLink} removeLink={removeLink} moveLink={moveLink} onIconFile={onLinkIconFile} />
            ))}
          </div>
        </section>

        {/* Data */}
        <section className="mt-4 grid grid-cols-3 gap-2 pb-2">
          <button onClick={onExport} className="rounded-xl bg-white/10 px-2 py-2.5 text-xs font-bold text-slate-100 ring-1 ring-white/10 hover:bg-white/20 active:scale-95">⬇ Export</button>
          <button onClick={() => fileImport.current?.click()} className="rounded-xl bg-white/10 px-2 py-2.5 text-xs font-bold text-slate-100 ring-1 ring-white/10 hover:bg-white/20 active:scale-95">⬆ Import</button>
          <button onClick={() => { if (confirm('Kembalikan ke demo awal?')) onReset() }} className="rounded-xl bg-red-500/25 px-2 py-2.5 text-xs font-bold text-red-100 ring-1 ring-red-400/20 hover:bg-red-500/40 active:scale-95">↺ Reset</button>
          <input ref={fileImport} type="file" accept="application/json" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) onImportFile(f); e.target.value = '' }} />
        </section>
      </aside>
    </div>
  )
}

function LinkEditor({ link, updateLink, removeLink, moveLink, onIconFile }) {
  const auto = detectBrand(link.url || '')
  const current = link.brand && link.brand !== 'auto' ? link.brand : auto
  return (
    <div className={`rounded-2xl bg-black/40 p-3 ring-1 ring-white/10 ${link.active ? '' : 'opacity-60'}`}>
      <div className="flex gap-2">
        <div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-lg bg-white/10 text-slate-100 ring-1 ring-white/10">
          {link.iconUrl
            ? <img src={link.iconUrl} alt="" className="h-full w-full object-cover" />
            : <BrandIcon brand={current} className="h-5 w-5" />}
        </div>
        <input value={link.title} onChange={(e) => updateLink(link.id, { title: e.target.value })} placeholder="Judul" className="min-w-0 flex-1 rounded-lg bg-white/5 px-2 py-1.5 text-sm text-slate-100 outline-none ring-1 ring-white/10" />
        <button onClick={() => updateLink(link.id, { active: !link.active })} title="Aktif/nonaktif" className="shrink-0 rounded-lg bg-white/5 px-2 text-sm ring-1 ring-white/10">{link.active ? '👁' : '🚫'}</button>
      </div>
      <input value={link.url} onChange={(e) => updateLink(link.id, { url: e.target.value })} placeholder="https://…" className="mt-2 w-full rounded-lg bg-white/5 px-2 py-1.5 text-xs text-slate-100 outline-none ring-1 ring-white/10" />
      {/* picker ikon brand */}
      <div className="mt-2 grid grid-cols-7 gap-1">
        <button
          onClick={() => updateLink(link.id, { brand: 'auto' })}
          title="Otomatis dari URL"
          className={`grid h-9 place-items-center rounded-lg text-sm ring-1 transition active:scale-90 ${(!link.brand || link.brand === 'auto') ? 'bg-white/20 text-white ring-white/40' : 'bg-white/5 text-slate-300 ring-white/10 hover:bg-white/10'}`}
        >✨</button>
        {BRANDS.map((b) => (
          <button
            key={b.id}
            onClick={() => updateLink(link.id, { brand: b.id, iconUrl: '' })}
            title={b.label}
            className={`grid h-9 place-items-center rounded-lg ring-1 transition active:scale-90 ${current === b.id && link.brand !== 'auto' ? 'bg-white/20 text-white ring-white/40' : 'bg-white/5 text-slate-300 ring-white/10 hover:bg-white/10'}`}
          >
            <BrandIcon brand={b.id} className="h-4.5 w-4.5" />
          </button>
        ))}
        <label title="Upload gambar custom" className="grid h-9 cursor-pointer place-items-center rounded-lg bg-white/5 text-sm text-slate-300 ring-1 ring-white/10 hover:bg-white/10">
          🖼
          <input type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) onIconFile(link.id, f); e.target.value = '' }} />
        </label>
      </div>
      {link.iconUrl && (
        <button onClick={() => updateLink(link.id, { iconUrl: '' })} className="mt-1.5 text-[11px] text-slate-400 underline">Hapus gambar custom, kembali ke ikon brand</button>
      )}
      <div className="mt-2 flex gap-1.5">
        <button onClick={() => moveLink(link.id, -1)} className="rounded-lg bg-white/5 px-2.5 py-1 text-xs text-slate-200 ring-1 ring-white/10">↑</button>
        <button onClick={() => moveLink(link.id, 1)} className="rounded-lg bg-white/5 px-2.5 py-1 text-xs text-slate-200 ring-1 ring-white/10">↓</button>
        <span className="flex-1" />
        <button onClick={() => removeLink(link.id)} className="rounded-lg bg-red-500/25 px-2.5 py-1 text-xs font-bold text-red-100 ring-1 ring-red-400/20">Hapus</button>
      </div>
    </div>
  )
}

function PublishSection({ data }) {
  const [slug, setSlug] = useState(() => slugify(data.profile?.name))
  const [lastUrl, setLastUrl] = useState('')
  const [msg, setMsg] = useState('')

  function doPublish() {
    const raw = (slug || slugify(data.profile?.name)).trim().toLowerCase() || 'tautan'
    if (!/^[a-z0-9-]{3,30}$/.test(raw)) {
      setMsg('Slug harus 3–30 karakter: huruf kecil, angka, strip (-).')
      return
    }
    const url = prettyUrlWithData(raw, data)
    setLastUrl(url)
    if (url.length > 7000) {
      setMsg('Link jadi (tapi panjang). Kecilkan foto avatar agar aman dibuka di semua browser.')
    } else {
      setMsg(`Terbit di /${raw} ✓ — tiap edit, tekan Publish lagi lalu salin link baru.`)
    }
  }

  async function doCopy(url) {
    await copyText(url)
    setMsg('Link tersalin ✓')
  }

  return (
    <section className="mt-4 rounded-2xl bg-black/30 p-4 ring-1 ring-white/10">
      <h3 className="font-display mb-1 text-sm font-bold uppercase tracking-widest text-slate-300/70">Publish Publik 🚀</h3>
      <p className="mb-3 text-[11px] leading-relaxed text-slate-300/60">Satu link utama ala Linktree: <code>/{slug || 'nama-kamu'}</code>. Data ikut di link, jadi bisa dibuka orang lain di HP / desktop mana pun.</p>
      <label className="block text-xs font-semibold text-slate-300/70">Nama bio (slug)</label>
      <div className="mt-1 flex gap-2">
        <input value={slug} onChange={(e) => setSlug(slugify(e.target.value))} placeholder="nama-kamu" className="min-w-0 flex-1 rounded-xl bg-black/40 px-3 py-2 text-sm text-slate-100 outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-white/30" />
        <button onClick={doPublish} className="shrink-0 rounded-xl px-4 py-2 text-xs font-extrabold text-black transition hover:brightness-110 active:scale-95" style={{ background: data.theme?.accent || '#22d3ee' }}>Publish</button>
      </div>
      {lastUrl && (
        <button onClick={() => doCopy(lastUrl)} className="mt-2 w-full truncate rounded-xl bg-white/10 px-3 py-2 text-left text-xs text-slate-100 ring-1 ring-white/15 hover:bg-white/20" title="Klik untuk salin">
          🔗 {lastUrl} <span className="opacity-60">(ketuk untuk salin)</span>
        </button>
      )}
      {msg && <p className="mt-2 text-[11px] text-emerald-300/90">{msg}</p>}
    </section>
  )
}

function AvatarPreview({ avatar, name }) {
  const initial = (name || 'A').trim().charAt(0).toUpperCase()
  if (avatar) return <img src={avatar} alt={name} className="h-14 w-14 rounded-2xl object-cover ring-1 ring-white/30" />
  return <div className="font-display grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-white/25 to-white/5 text-2xl font-bold text-slate-50"> {initial}</div>
}
