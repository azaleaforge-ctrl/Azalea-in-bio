// Ikon brand sebagai SVG inline (stroke minimalis, tajam di semua ukuran).
// Auto-deteksi dari domain URL via detectBrand().

function Base({ children, className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      {children}
    </svg>
  )
}

const PATHS = {
  instagram: (<><rect x="3.5" y="3.5" width="17" height="17" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17" cy="7" r="0.6" fill="currentColor" /></>),
  tiktok: (<><path d="M14 4v10.2a3.8 3.8 0 1 1-3.8-3.8" /><path d="M14 4c.4 2.7 2.2 4.5 5 4.8" /></>),
  youtube: (<><rect x="2.8" y="6" width="18.4" height="12" rx="3.5" /><path d="M10.2 9.6l4.8 2.4-4.8 2.4z" fill="currentColor" stroke="none" /></>),
  x: (<><path d="M4.5 4.5l15 15" /><path d="M19.5 4.5l-15 15" /></>),
  facebook: (<><path d="M14.5 8.5H17V5.5h-2.5a3.5 3.5 0 0 0-3.5 3.5v2H8.5V14H11v6h3.5v-6h2.3l.7-3h-3V9c0-.3.2-.5.5-.5z" /></>),
  whatsapp: (<><path d="M12 3.5a8.5 8.5 0 0 0-7.3 12.8L3.5 20.5l4.3-1.1A8.5 8.5 0 1 0 12 3.5z" /><path d="M9 8.8c.3-.6 1.2-.7 1.5 0l.7 1.5 1.6.7 1 1c.6.8.3 1.6-.5 2 2 .3 4.3-1 4.7-2.5.2-.8-.3-1.3-1-1.7l-1.8-1-1.7-.5-1.5-1c-.7-.4-1.4-.3-2 .3z" strokeWidth={1.4} /></>),
  telegram: (<><path d="M21 4.5L3.5 11.2l6.6 2.1 2.1 6.7 4.2-5.6 4.6-9.9z" /><path d="M10.1 13.3l9.9-8.8-4.6 9.9" strokeWidth={1.4} /></>),
  spotify: (<><circle cx="12" cy="12" r="8.5" /><path d="M8 10.2c2.8-.8 5.6-.4 8 .9" /><path d="M8.4 12.8c2.2-.6 4.4-.3 6.3.8" strokeWidth={1.4} /><path d="M8.8 15.2c1.7-.4 3.3-.2 4.7.6" strokeWidth={1.3} /></>),
  github: (<><path d="M8 8l-4 4 4 4" /><path d="M16 8l4 4-4 4" /><path d="M13 5l-2 14" /></>),
  linkedin: (<><rect x="3.5" y="3.5" width="17" height="17" rx="3.5" /><path d="M8 10.5V17" /><circle cx="8" cy="7.8" r="0.7" fill="currentColor" /><path d="M12 17v-3.8a2.2 2.2 0 0 1 4.4 0V17" /></>),
  website: (<><circle cx="12" cy="12" r="8.5" /><path d="M3.5 12h17" /><path d="M12 3.5c2.6 2.4 3.9 5.3 3.9 8.5s-1.3 6.1-3.9 8.5c-2.6-2.4-3.9-5.3-3.9-8.5s1.3-6.1 3.9-8.5z" /></>),
  mail: (<><rect x="3" y="5.5" width="18" height="13" rx="2.5" /><path d="M4 7.5l8 6 8-6" /></>),
}

export const BRANDS = [
  { id: 'instagram', label: 'Instagram' },
  { id: 'tiktok', label: 'TikTok' },
  { id: 'youtube', label: 'YouTube' },
  { id: 'x', label: 'X' },
  { id: 'facebook', label: 'Facebook' },
  { id: 'whatsapp', label: 'WhatsApp' },
  { id: 'telegram', label: 'Telegram' },
  { id: 'spotify', label: 'Spotify' },
  { id: 'github', label: 'GitHub' },
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'website', label: 'Website' },
  { id: 'mail', label: 'Email' },
]

export function BrandIcon({ brand, className = 'h-6 w-6' }) {
  return <Base className={className}>{PATHS[brand] || PATHS.website}</Base>
}

export function detectBrand(url = '') {
  const u = String(url).toLowerCase()
  if (u.includes('instagram.com')) return 'instagram'
  if (u.includes('tiktok.com')) return 'tiktok'
  if (u.includes('youtube.com') || u.includes('youtu.be')) return 'youtube'
  if (u.includes('twitter.com') || u.includes('x.com')) return 'x'
  if (u.includes('facebook.com') || u.includes('fb.com') || u.includes('fb.watch')) return 'facebook'
  if (u.includes('wa.me') || u.includes('whatsapp.com') || u.includes('whatsapp')) return 'whatsapp'
  if (u.includes('t.me') || u.includes('telegram')) return 'telegram'
  if (u.includes('spotify.com') || u.includes('open.spotify')) return 'spotify'
  if (u.includes('github.com')) return 'github'
  if (u.includes('linkedin.com')) return 'linkedin'
  if (u.startsWith('mailto:') || u.includes('gmail.com') || u.includes('mail.')) return 'mail'
  return 'website'
}

// brand efektif sebuah link: 'auto' -> deteksi dari URL.
// Data lama ber-icon emoji otomatis jatuh ke deteksi brand.
export function resolveLinkBrand(link = {}) {
  if (link.iconUrl) return null // gambar custom, bukan SVG brand
  if (link.brand && link.brand !== 'auto' && PATHS[link.brand]) return link.brand
  return detectBrand(link.url)
}

export function brandLabel(id) {
  return (BRANDS.find((b) => b.id === id) || {}).label || 'Website'
}
