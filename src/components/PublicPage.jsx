import { useEffect, useState } from 'react'
import BackgroundAurora from './BackgroundAurora.jsx'
import ProfileLinksView from './ProfileLinksView.jsx'
import { resolveVariant } from '../data/defaults.js'
import { getPublished, decodeData } from '../lib/publish.js'
import { getBioCloud } from '../lib/firebase.js'

// Halaman publik BERSIH: profil + links + background + klik.
// Tanpa tombol edit, tanpa panel, tanpa branding. Judul tab = nama profil.
// Layout persis sama dengan mode edit via ProfileLinksView.
// Prioritas: decodeData(d) > Firestore getBioCloud(id) > getPublished(id) lokal.
export default function PublicPage({ id, dataParam }) {
  const [cloudSnap, setCloudSnap] = useState(null)
  const [loading, setLoading] = useState(!!id && !dataParam)

  useEffect(() => {
    let alive = true
    if (!id || dataParam) {
      setLoading(false)
      return
    }
    setLoading(true)
    getBioCloud(id).then((snap) => {
      if (alive) {
        setCloudSnap(snap)
        setLoading(false)
      }
    })
    return () => {
      alive = false
    }
  }, [id, dataParam])

  let snap = null
  if (dataParam) {
    try {
      snap = decodeData(dataParam)
    } catch {
      snap = null
    }
  }
  if (!snap) snap = cloudSnap
  if (!snap && id && !loading) snap = getPublished(id)

  const name = snap?.profile?.name || 'Tautan'
  useEffect(() => {
    document.title = name
    return () => {
      document.title = 'Link in Bio'
    }
  }, [name])

  useEffect(() => {
    function onMouse(e) {
      const x = (e.clientX / window.innerWidth - 0.5) * 2
      const y = (e.clientY / window.innerHeight - 0.5) * 2
      document.documentElement.style.setProperty('--mx', x.toFixed(3))
      document.documentElement.style.setProperty('--my', y.toFixed(3))
    }
    window.addEventListener('mousemove', onMouse)
    return () => window.removeEventListener('mousemove', onMouse)
  }, [])

  if (loading) {
    return (
      <div className="noise min-h-screen">
        <BackgroundAurora variantId="aurora" />
        <main className="mx-auto grid min-h-screen w-full max-w-md place-items-center px-5">
          <div className="glass rise w-full rounded-[28px] p-8 text-center">
            <p className="font-display text-lg font-bold text-slate-50">Memuat…</p>
          </div>
        </main>
      </div>
    )
  }

  if (!snap) {
    return (
      <div className="noise min-h-screen">
        <BackgroundAurora variantId="aurora" />
        <main className="mx-auto grid min-h-screen w-full max-w-md place-items-center px-5">
          <div className="glass rise w-full rounded-[28px] p-8 text-center">
            <p className="font-display text-lg font-bold text-slate-50">Tautan tidak ditemukan</p>
            <p className="mt-2 text-sm text-slate-300/70">Link publik ini belum diterbitkan di perangkat ini, atau datanya tidak terbaca.</p>
          </div>
        </main>
      </div>
    )
  }

  const accent = snap.theme?.accent || '#22d3ee'
  const variantId = resolveVariant(snap.theme?.bgVariant)

  useEffect(() => {
    document.documentElement.style.setProperty('--accent', accent)
  }, [accent])

  return (
    <div className="noise min-h-screen">
      <BackgroundAurora variantId={variantId} />
      {/* spacer tak terlihat setinggi topbar edit agar posisi konten identik */}
      <div className="mx-auto w-full max-w-6xl px-5 pt-5" aria-hidden="true">
        <div className="invisible flex items-center justify-between">
          <span className="rounded-full px-4 py-1.5 text-xs font-bold">✦</span>
          <span className="rounded-full px-4 py-2 text-sm font-bold">✎</span>
        </div>
      </div>
      <ProfileLinksView
        data={snap}
        accent={accent}
        variantId={variantId}
        emptyHint="Belum ada tautan aktif."
      />
    </div>
  )
}
