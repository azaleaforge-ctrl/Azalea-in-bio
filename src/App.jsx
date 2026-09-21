import { useCallback, useEffect, useState } from 'react'
import BackgroundAurora from './components/BackgroundAurora.jsx'
import EditPanel from './components/EditPanel.jsx'
import PublicPage from './components/PublicPage.jsx'
import ProfileLinksView from './components/ProfileLinksView.jsx'
import { Toaster, toast } from './components/Toast.jsx'
import { copyText, restorePublished } from './lib/publish.js'
import { updateParallax } from './components/backgrounds/fx.js'
import { loadData, saveData, resetData, exportJSON, parseImportFile } from './lib/storage.js'
import { resolveVariant } from './data/defaults.js'

// Hash-routing agar dist/index.html statis tetap works:
// `#/` atau `#/edit` = halaman edit, `#/p/<id>[?d=...]` = publik,
// `#/r?d=...` = publik murni dari data di URL.
// Pretty URL Linktree-like `/:slug` (Vercel rewrite -> /index.html)
// diprioritaskan sebelum fallback hash lama.
const RESERVED = new Set(['api', 'assets'])
function parseRoute() {
  const pathSeg = window.location.pathname.split('/').filter(Boolean)
  if (pathSeg.length === 1) {
    const slug = decodeURIComponent(pathSeg[0])
    if (slug && !RESERVED.has(slug.toLowerCase()) && !slug.includes('.')) {
      return { name: 'public', id: slug.toLowerCase(), d: new URLSearchParams(window.location.search).get('d') }
    }
  }
  const raw = (window.location.hash || '#/').replace(/^#/, '')
  const [path, query = ''] = raw.split('?')
  const params = new URLSearchParams(query)
  const seg = path.split('/').filter(Boolean)
  if (seg[0] === 'p' && seg[1]) return { name: 'public', id: decodeURIComponent(seg[1]), d: params.get('d') }
  if (seg[0] === 'r') return { name: 'public', id: '', d: params.get('d') }
  return { name: 'edit', id: '', d: null }
}

export default function App() {
  const [route, setRoute] = useState(() => parseRoute())

  useEffect(() => {
    function onHash() {
      setRoute(parseRoute())
      window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', onHash)
    window.addEventListener('popstate', onHash)
    return () => { window.removeEventListener('hashchange', onHash); window.removeEventListener('popstate', onHash) }
  }, [])

  if (route.name === 'public') {
    return <PublicPage id={route.id} dataParam={route.d} />
  }
  return <Editor />
}

function Editor() {
  const [data, setData] = useState(() => loadData())
  const [editing, setEditing] = useState(false)

  // auto-save draf (tidak menyentuh snapshot publik)
  useEffect(() => {
    saveData(data)
    document.documentElement.style.setProperty('--accent', data.theme.accent)
    document.title = 'Edit · ' + (data.profile?.name || 'Link in Bio')
  }, [data])

  // parallax ikut mouse (di-clamp di helper bersama)
  useEffect(() => {
    function onMouse(e) {
      updateParallax(e.clientX, e.clientY)
    }
    window.addEventListener('mousemove', onMouse)
    return () => window.removeEventListener('mousemove', onMouse)
  }, [])

  const visibleCount = data.links.filter((l) => l.active).length
  const variantId = resolveVariant(data.theme.bgVariant)

  const onImportFile = useCallback(
    async (file) => {
      try {
        const { data: parsed, published } = await parseImportFile(file)
        setData(parsed)
        const n = restorePublished(published) // lokal saja, tanpa publish ulang ke server
        toast(n > 0 ? `Import berhasil ✓ ${n} link publish langsung live` : 'Import berhasil ✓')
      } catch (e) {
        toast('Gagal: ' + (e?.message || 'file JSON tidak valid'), 'error')
      }
    },
    []
  )

  const onShare = useCallback(async () => {
    const ok = await copyText(window.location.href)
    toast(ok ? 'Link telah disalin ✓' : 'Gagal menyalin link', ok ? 'success' : 'error')
  }, [])

  return (
    <div className="noise min-h-screen">
      <BackgroundAurora variantId={variantId} />

      {/* topbar */}
      <header className="rise mx-auto flex w-full max-w-6xl items-center justify-between px-5 pt-5">
        <span className="glass brand-pill rounded-full px-5 py-2"><img src="/logo-dark.png" alt="Azalea In Bio" className="brand-logo" /></span>
        <div className="flex gap-2">
          <button onClick={() => setEditing(true)} className="rounded-full px-4 py-2 text-sm font-bold text-black transition hover:brightness-110 active:scale-95" style={{ background: data.theme.accent }}>✎ Edit</button>
        </div>
      </header>

      <ProfileLinksView
        data={data}
        accent={data.theme.accent}
        variantId={variantId}
        profileExtra={
          <>
            <div className="mt-5 flex items-center justify-center gap-2 text-xs">
              <span className="rounded-full bg-white/10 px-3 py-1 text-slate-200 ring-1 ring-white/10">{visibleCount} tautan aktif</span>
              <button onClick={onShare} className="rounded-full bg-white/10 px-3 py-1 font-bold text-slate-100 ring-1 ring-white/10 hover:bg-white/20 active:scale-95">⧉ Bagikan</button>
            </div>
            <div className="mt-5 hidden items-center gap-2 rounded-2xl bg-black/30 p-3 text-left text-xs leading-relaxed text-slate-300/80 ring-1 ring-white/10 lg:flex">
              <span className="text-lg">💡</span>
              <span>Di layar besar profil menempel di kiri saat daftar tautan di kanan di-scroll.</span>
            </div>
          </>
        }
        emptyHint={<>Belum ada tautan aktif. Buka <b>Mode Edit</b> untuk menyalakan tautan.</>}
        footer={
          <footer className="reveal mt-10 flex flex-col items-center gap-1.5 text-center">
            <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-300/50">Dibuat dengan</span>
            <img src="/logo-dark.png" alt="Azalea In Bio" className="brand-mini" />
            <span className="text-[11px] text-slate-300/40">tersimpan otomatis di browser</span>
          </footer>
        }
      />

      {/* tombol floating edit */}
      {!editing && (
        <button
          onClick={() => setEditing(true)}
          className="fixed bottom-5 right-5 z-30 rounded-full px-5 py-3.5 text-sm font-extrabold text-black shadow-2xl transition hover:brightness-110 active:scale-95"
          style={{ background: data.theme.accent, boxShadow: `0 12px 40px -8px ${data.theme.accent}` }}
        >✎ Edit halaman</button>
      )}

      {editing && (
        <EditPanel
          data={data}
          setData={setData}
          onClose={() => setEditing(false)}
          onExport={() => exportJSON(data)}
          onImportFile={onImportFile}
          onReset={() => setData(resetData())}
        />
      )}
      <Toaster />
    </div>
  )
}
