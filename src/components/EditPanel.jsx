import { useEffect, useRef, useState } from 'react'
import { BG_VARIANTS } from '../data/defaults.js'
import { BRANDS, BrandIcon, detectBrand } from './icons/brandIcons.jsx'
import { listPublished, savePublished, deletePublished, prettyUrl, slugify, makePublicSlug, copyText, snapshotOf } from '../lib/publish.js'
import { saveBioCloud, deleteBioCloud, getBioCloud, isFirebaseConfigured } from '../lib/firebase.js'
import { toast } from './Toast.jsx'
import { uploadAvatar, uploadLinkIcon } from '../lib/uploadImage.js'
import ConfirmDialog from './Confirm.jsx'

const ACCENTS = ['#22d3ee', '#f472b6', '#a3e635', '#facc15', '#8b5cf6', '#fb923c']
const BIO_MAX = 500

export default function EditPanel({ data, setData, onExport, onImportFile, onReset, onClose }) {
  const fileAvatar = useRef(null)
  const fileImport = useRef(null)
  const [confirm, setConfirm] = useState(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [avatarMsg, setAvatarMsg] = useState('')
  const [uploadingIconId, setUploadingIconId] = useState(null)
  const closeConfirm = () => setConfirm(null)

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
    const target = data.links.find((l) => l.id === id)
    setConfirm({
      title: 'Hapus tautan?',
      message: `"${target?.title || 'Tautan'}" akan dihapus dari daftar. Lanjutkan?`,
      confirmLabel: 'Ya, hapus',
      onYes: () => {
        setData((d) => ({ ...d, links: d.links.filter((l) => l.id !== id) }))
        setConfirm(null)
      },
    })
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

  async function onAvatarFile(f) {
    if (!f || uploadingAvatar) return
    setUploadingAvatar(true)
    setAvatarMsg('Mengunggah foto…')
    try {
      const url = await uploadAvatar(f)
      patchProfile({ avatar: url })
      toast('Foto terunggah ✓')
    } catch (e) {
      toast(e?.message || 'Upload gagal. Coba lagi.', 'error')
    } finally {
      setUploadingAvatar(false)
      setAvatarMsg('')
      if (fileAvatar.current) fileAvatar.current.value = ''
    }
  }

  async function onLinkIconFile(id, f) {
    if (!f || uploadingIconId) return
    setUploadingIconId(id)
    try {
      const url = await uploadLinkIcon(f)
      updateLink(id, { iconUrl: url })
      toast('Ikon terunggah ✓')
    } catch (e) {
      toast(e?.message || 'Upload gagal. Coba lagi.', 'error')
    } finally {
      setUploadingIconId(null)
    }
  }

  const bioRemaining = BIO_MAX - (data.profile.bio?.length || 0)

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
              <button onClick={() => fileAvatar.current?.click()} disabled={uploadingAvatar} className="rounded-xl bg-white/10 px-3 py-2 text-xs font-bold text-slate-100 ring-1 ring-white/10 hover:bg-white/20 active:scale-95 disabled:opacity-60">{uploadingAvatar ? 'Mengunggah…' : 'Upload foto'}</button>
              <input ref={fileAvatar} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => onAvatarFile(e.target.files?.[0])} />
              {avatarMsg && <p className="text-[11px] text-slate-300/70" aria-live="polite">{avatarMsg}</p>}
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
          <label htmlFor="bio-input" className="mt-3 block text-xs font-semibold text-slate-300/70">Bio</label>
          <div className="relative mt-1">
            <textarea
              id="bio-input"
              value={data.profile.bio}
              onChange={(e) => patchProfile({ bio: e.target.value })}
              rows={3}
              maxLength={BIO_MAX}
              aria-describedby="bio-counter"
              className="w-full rounded-xl bg-black/40 px-3 py-2 pb-6 text-sm text-slate-100 outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-white/30"
            />
            <span id="bio-counter" className={`pointer-events-none absolute bottom-2 right-3 text-[11px] tabular-nums ${bioRemaining === 0 ? 'font-bold text-red-400' : 'text-slate-400'}`}>
              {bioRemaining}/{BIO_MAX}
            </span>
          </div>
        </section>

        <PublishSection data={data} requestConfirm={(c) => setConfirm(c)} />

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
              <LinkEditor key={l.id} link={l} updateLink={updateLink} removeLink={removeLink} moveLink={moveLink} onIconFile={onLinkIconFile} uploading={uploadingIconId === l.id} />
            ))}
          </div>
        </section>

        {/* Data */}
        <section className="mt-4 grid grid-cols-3 gap-2 pb-2">
          <button onClick={onExport} className="rounded-xl bg-white/10 px-2 py-2.5 text-xs font-bold text-slate-100 ring-1 ring-white/10 hover:bg-white/20 active:scale-95">⬇ Export</button>
          <button onClick={() => fileImport.current?.click()} className="rounded-xl bg-white/10 px-2 py-2.5 text-xs font-bold text-slate-100 ring-1 ring-white/10 hover:bg-white/20 active:scale-95">⬆ Import</button>
          <button onClick={() => setConfirm({ title: 'Kosongkan semua isi?', message: 'Semua isi akan dihapus dan dikosongkan. Lanjutkan?', confirmLabel: 'Ya, kosongkan', onYes: () => { onReset(); setConfirm(null) } })} className="rounded-xl bg-red-500/25 px-2 py-2.5 text-xs font-bold text-red-100 ring-1 ring-red-400/20 hover:bg-red-500/40 active:scale-95">↺ Reset</button>
          <input ref={fileImport} type="file" accept="application/json" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) onImportFile(f); e.target.value = '' }} />
        </section>
      </aside>
      <ConfirmDialog
        open={!!confirm}
        title={confirm?.title || ''}
        message={confirm?.message || ''}
        confirmLabel={confirm?.confirmLabel || 'Ya, hapus'}
        onConfirm={() => confirm?.onYes?.()}
        onCancel={closeConfirm}
      />
    </div>
  )
}

// ---------- WhatsApp: normalisasi nomor & link grup ----------
function isGrupUrl(url = '') {
  return /chat\.whatsapp\.com/i.test(String(url))
}
function parseWaPersonal(url = '') {
  const s = String(url)
  const m = s.match(/wa\.me\/(\d+)/i) || s.match(/[?&]phone=(\d+)/i)
  return m ? m[1] : ''
}
function parseWaGroup(url = '') {
  const m = String(url).match(/chat\.whatsapp\.com\/([A-Za-z0-9]+)/i)
  return m ? m[1] : ''
}
// '08…' → '628…'; sudah '62…' → tetap; lainnya → prefix '62'.
function normalizeWaPersonal(raw) {
  let d = String(raw).replace(/\D/g, '')
  if (!d) return ''
  if (d.startsWith('0')) d = '62' + d.slice(1)
  else if (!d.startsWith('62')) d = '62' + d
  return 'https://wa.me/' + d
}
// Full invite atau kode saja → full URL; selain itu '' (invalid).
function normalizeWaGroup(raw) {
  const s = String(raw).trim()
  if (!s) return ''
  const m = s.match(/chat\.whatsapp\.com\/([A-Za-z0-9]+)/i)
  if (m) return 'https://chat.whatsapp.com/' + m[1]
  if (/^[A-Za-z0-9]{8,}$/.test(s)) return 'https://chat.whatsapp.com/' + s
  return ''
}

function WaEditor({ link, updateLink }) {
  const [tab, setTab] = useState(() => (isGrupUrl(link.url) ? 'grup' : 'pribadi'))
  const [raw, setRaw] = useState(() => (isGrupUrl(link.url) ? parseWaGroup(link.url) : parseWaPersonal(link.url)))

  function switchTab(t) {
    setTab(t)
    // Isi ulang dari URL tersimpan untuk mode yang dituju; nilai tersimpan tak dirusak.
    setRaw(t === 'grup' ? parseWaGroup(link.url || '') : parseWaPersonal(link.url || ''))
  }
  function onRaw(v) {
    setRaw(v)
    if (tab === 'pribadi') {
      if (!String(v).trim()) return updateLink(link.id, { url: '' })
      updateLink(link.id, { url: normalizeWaPersonal(v) })
    } else {
      if (!String(v).trim()) return updateLink(link.id, { url: '' })
      const n = normalizeWaGroup(v)
      if (n) updateLink(link.id, { url: n })
    }
  }

  const digits = String(raw).replace(/\D/g, '')
  const err = tab === 'pribadi'
    ? (String(raw).trim() && digits.length < 10 ? 'Nomor kurang lengkap (min. 10 digit).' : '')
    : (String(raw).trim() && !normalizeWaGroup(raw) ? 'Tempel link undangan grup (chat.whatsapp.com/…).' : '')

  return (
    <div className="mt-2">
      <div className="grid grid-cols-2 gap-1 rounded-xl bg-white/5 p-1 ring-1 ring-white/10" role="tablist" aria-label="Jenis link WhatsApp">
        {['pribadi', 'grup'].map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => switchTab(t)}
            className={`rounded-lg px-2 py-1.5 text-xs font-bold ring-1 transition active:scale-95 ${tab === t ? 'bg-white/20 text-white ring-white/40' : 'bg-transparent text-slate-400 ring-transparent hover:bg-white/10'}`}
          >{t === 'pribadi' ? 'Pribadi' : 'Grup'}</button>
        ))}
      </div>
      <label className="mt-2 block text-[11px] font-semibold text-slate-300/70">
        {tab === 'pribadi' ? 'Nomor WA (tanpa + / spasi)' : 'Link undangan grup'}
      </label>
      <input
        value={raw}
        onChange={(e) => onRaw(e.target.value)}
        placeholder={tab === 'pribadi' ? '81234567890' : 'https://chat.whatsapp.com/…'}
        inputMode={tab === 'pribadi' ? 'numeric' : undefined}
        className="mt-1 w-full rounded-xl bg-black/40 px-3 py-2 text-sm text-slate-100 outline-none ring-1 ring-white/10 placeholder:text-slate-500 focus:ring-2 focus:ring-white/30"
      />
      {err && <p className="mt-1 text-[11px] text-red-400">{err}</p>}
      {link.url && <p className="mt-1.5 truncate text-[11px] text-emerald-300/80" title={link.url}>Link: {link.url}</p>}
    </div>
  )
}

function LinkEditor({ link, updateLink, removeLink, moveLink, onIconFile, uploading }) {
  const auto = detectBrand(link.url || '')
  const current = link.brand && link.brand !== 'auto' ? link.brand : auto
  const isWa = current === 'whatsapp'
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
      {isWa
        ? <WaEditor key={'wa-' + link.id} link={link} updateLink={updateLink} />
        : <input value={link.url} onChange={(e) => updateLink(link.id, { url: e.target.value })} placeholder="https://…" className="mt-2 w-full rounded-lg bg-white/5 px-2 py-1.5 text-xs text-slate-100 outline-none ring-1 ring-white/10" />}
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
        <label title={uploading ? 'Mengunggah foto…' : 'Upload gambar custom'} aria-disabled={uploading} className={`grid h-9 place-items-center rounded-lg bg-white/5 text-sm text-slate-300 ring-1 ring-white/10 hover:bg-white/10 ${uploading ? 'pointer-events-none opacity-60' : 'cursor-pointer'}`}>
          {uploading ? '⏳' : '🖼'}
          <input type="file" accept="image/jpeg,image/png,image/webp" hidden disabled={uploading} onChange={(e) => { const f = e.target.files?.[0]; if (f) onIconFile(link.id, f); e.target.value = '' }} />
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

function PublishSection({ data, requestConfirm }) {
  const [slug, setSlug] = useState(() => data.profile?.name || '')
  const [items, setItems] = useState(() => listPublished())
  const [lastUrl, setLastUrl] = useState('')
  const [msg, setMsg] = useState('')
  const [saving, setSaving] = useState(false)

  // Sinkron dari localStorage: survive refresh + antar-tab.
  useEffect(() => {
    setItems(listPublished())
  }, [data])
  useEffect(() => {
    function onStorage(e) {
      if (e.key === 'glass-aurora-published-v1') setItems(listPublished())
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  // Teks mentah saat mengetik; slugify hanya saat dipakai (fallback 'tautan' diabaikan bila kosong).
  const trimmed = slug.trim()
  const prettyBase = trimmed ? slugify(trimmed) : ''
  // Sudah terbit bila ada item dengan id persis ATAU berawalan base + '-' (slug bersuffix).
  const publishedMatch = prettyBase
    ? items.find((i) => i.id === prettyBase || i.id.startsWith(prettyBase + '-'))
    : null
  const isPublished = !!publishedMatch

  // Simpan snapshot ke id yang SAMA (tidak pernah regen suffix di sini).
  async function saveToId(id) {
    setSaving(true)
    setMsg('')
    try {
      if (isFirebaseConfigured) {
        await saveBioCloud(id, snapshotOf(data))
      }
    } catch {
      setMsg('Gagal simpan ke cloud. Cek koneksi / rules Firestore.')
      toast('Gagal simpan ke cloud', 'error')
      setSaving(false)
      return null
    }
    savePublished(id, data)
    setItems(listPublished())
    setLastUrl(prettyUrl(id))
    setSaving(false)
    return id
  }

  // Publish BARU: beri akhiran acak, cek tabrakan lokal + cloud (maks 3x).
  async function doPublishNew() {
    if (!slug.trim()) {
      setMsg('Nama belum diisi.')
      toast('Nama belum diisi', 'error')
      return
    }
    const base = slugify(slug)
    if (!/^[a-z0-9-]{3,30}$/.test(base)) {
      setMsg('Nama harus 3–30 karakter: huruf kecil, angka, strip (-).')
      toast('Nama tidak valid', 'error')
      return
    }
    setSaving(true)
    setMsg('')
    let candidate = ''
    for (let i = 0; i < 3; i++) {
      candidate = makePublicSlug(base)
      if (candidate.length > 40) continue
      const takenLocal = listPublished().some((it) => it.id === candidate)
      const takenCloud = isFirebaseConfigured ? !!(await getBioCloud(candidate)) : false
      if (!takenLocal && !takenCloud) break
      candidate = ''
    }
    if (!candidate) {
      setSaving(false)
      setMsg('Gagal membuat link unik. Coba lagi.')
      toast('Gagal membuat link unik', 'error')
      return
    }
    setSaving(false)
    const id = await saveToId(candidate)
    if (id) {
      toast(`Terbit di /${id} ✓`)
      setMsg(`Terbit di /${id} ✓ Perbarui tidak mengubah URL.`)
    }
  }

  // Tombol utama: sudah punya terbitan untuk base ini → perbarui itu;
  // belum → buat terbitan baru bersuffix. Per-item selalu pakai id yang sama.
  async function doPublish(id) {
    if (id) {
      if (!/^[a-z0-9-]{3,40}$/.test(id)) {
        setMsg('ID link tidak valid.')
        toast('ID link tidak valid', 'error')
        return
      }
      const saved = await saveToId(id)
      if (saved) {
        toast(`Perubahan di /${saved} disimpan ✓`)
        setMsg(`Perubahan di /${saved} disimpan ✓`)
      }
      return
    }
    if (publishedMatch) {
      const saved = await saveToId(publishedMatch.id)
      if (saved) {
        toast(`Perubahan di /${saved} disimpan ✓`)
        setMsg(`Perubahan di /${saved} disimpan ✓`)
      }
      return
    }
    await doPublishNew()
  }

  async function doCopy(url) {
    const ok = await copyText(url)
    if (ok) {
      setMsg('Link tersalin ✓')
      toast('Link telah disalin ✓')
    } else {
      setMsg('Gagal menyalin. Salin manual: ' + url)
      toast('Gagal menyalin link', 'error')
    }
  }

  function doDelete(id) {
    requestConfirm?.({
      title: 'Hapus link terbit?',
      message: `Link /${id} tidak bisa dibuka lagi. Lanjutkan?`,
      confirmLabel: 'Ya, hapus',
      onYes: async () => {
        try {
          if (isFirebaseConfigured) await deleteBioCloud(id)
        } catch {
          // abaikan, lanjut hapus lokal
        }
        deletePublished(id)
        setItems(listPublished())
        setLastUrl((u) => (u.endsWith('/' + id) ? '' : u))
        setMsg(`/${id} dihapus.`)
        requestConfirm?.(null)
      },
    })
  }

  return (
    <section className="mt-4 rounded-2xl bg-black/30 p-4 ring-1 ring-white/10">
      <h3 className="font-display mb-1 text-sm font-bold uppercase tracking-widest text-slate-300/70">Publish Publik 🚀</h3>
      <p className="mb-3 text-[11px] leading-relaxed text-slate-300/60">Satu link unik azaleainbio: <code>/{prettyBase || 'nama-kamu'}-xxxxxx</code>. Akhiran acak tiap terbitan — tidak bisa ditebak. Ubah isi kapan aja via <b>Perbarui</b> — URL tetap sama. Link lama tanpa akhiran tetap jalan.</p>
      <label className="block text-xs font-semibold text-slate-300/70">Nama bio (dasar link)</label>
      <div className="mt-1 flex gap-2">
        <input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="nama-kamu" className="min-w-0 flex-1 rounded-xl bg-black/40 px-3 py-2 text-sm text-slate-100 outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-white/30" />
        <button
          onClick={() => doPublish()}
          disabled={saving}
          aria-live="polite"
          title={isPublished ? 'Sudah terbit — klik untuk memperbarui isi' : 'Terbitkan link'}
          className={`shrink-0 rounded-xl px-4 py-2 text-xs font-extrabold transition active:scale-95 disabled:opacity-60 ${isPublished ? 'bg-emerald-400 text-emerald-950 hover:brightness-110' : 'text-black hover:brightness-110'}`}
          style={isPublished ? { boxShadow: '0 8px 28px -10px rgba(52,211,153,.7)' } : { background: data.theme?.accent || '#22d3ee' }}
        >{saving ? 'Menyimpan…' : isPublished ? 'Terbit ✓' : 'Publish'}</button>
      </div>
      {lastUrl && (
        <button onClick={() => doCopy(lastUrl)} className="mt-2 w-full truncate rounded-xl bg-white/10 px-3 py-2 text-left text-xs text-slate-100 ring-1 ring-white/15 hover:bg-white/20" title="Klik untuk salin">
          🔗 {lastUrl} <span className="opacity-60">(ketuk untuk salin)</span>
        </button>
      )}
      {items.length > 0 && (
        <div className="mt-3 space-y-1.5">
          <p className="text-[11px] font-bold text-slate-300/70">Link terbit ({items.length})</p>
          {items.map((it) => (
            <div key={it.id} className="flex items-center gap-1.5 rounded-xl bg-black/40 px-2.5 py-1.5 ring-1 ring-white/10">
              <span className="min-w-0 flex-1 truncate text-xs text-slate-200">/{it.id} <span className="opacity-50">· {it.name}</span></span>
              <button onClick={() => doCopy(prettyUrl(it.id))} title="Salin link" className="rounded-lg bg-white/10 px-2 py-1 text-[11px] ring-1 ring-white/10 hover:bg-white/20">Salin</button>
              <button onClick={() => doPublish(it.id)} disabled={saving} title="Simpan perubahan ke link ini" className="rounded-lg bg-white/10 px-2 py-1 text-[11px] ring-1 ring-white/10 hover:bg-white/20 disabled:opacity-60">Perbarui</button>
              <button onClick={() => doDelete(it.id)} title="Hapus" className="rounded-lg bg-red-500/25 px-2 py-1 text-[11px] text-red-100 ring-1 ring-red-400/20">✕</button>
            </div>
          ))}
        </div>
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
