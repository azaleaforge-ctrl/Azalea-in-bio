import { useEffect, useState } from 'react'
import { resolveVariant, variantOf } from '../data/defaults.js'
import AuroraCanvas from './backgrounds/AuroraCanvas.jsx'
import RainCanvas from './backgrounds/RainCanvas.jsx'
import StarfieldCanvas from './backgrounds/StarfieldCanvas.jsx'

function Scene({ id }) {
  if (id === 'hujan') return <RainCanvas />
  if (id === 'bintang') return <StarfieldCanvas />
  return <AuroraCanvas />
}

// Orkestrasi fade antar background: layer lama ditahan 1 detik
// sambil memudar, layer baru fade-in di atasnya.
export default function BackgroundAurora({ variantId }) {
  const current = resolveVariant(variantId)
  const [shown, setShown] = useState(current)
  const [prev, setPrev] = useState(null)
  const base = variantOf(current).base

  useEffect(() => {
    if (current === shown) return
    setPrev(shown)
    setShown(current)
    const t = setTimeout(() => setPrev(null), 1100)
    return () => clearTimeout(t)
  }, [current, shown])

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden" style={{ background: base }} aria-hidden>
      {prev && prev !== shown && (
        <div key={'old-' + prev} className="bg-layer-fadeout absolute inset-0">
          <Scene id={prev} />
        </div>
      )}
      <div key={'new-' + shown} className="bg-layer-fadein absolute inset-0">
        <Scene id={shown} />
      </div>
      {/* parallax halus ikut mouse + vignette global agar kartu kaca tetap terbaca.
          -inset-10 = bleed 40px tiap sisi; geser maks ±14px/±10px, jadi
          vignette selalu menutup viewport penuh (margin aman ≥26px). */}
      <div
        className="parallax-layer pointer-events-none absolute -inset-10"
        style={{ '--px': '14px', '--py': '10px', background: 'radial-gradient(ellipse at center,transparent 40%,rgba(0,0,0,.42) 100%)' }}
      />
    </div>
  )
}
