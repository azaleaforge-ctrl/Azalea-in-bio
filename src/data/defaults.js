export const BG_VARIANTS = [
  {
    id: 'aurora',
    label: 'Aurora Realistis',
    desc: 'Tirai hijau · teal · ungu',
    icon: '🌌',
    base: '#020a18',
    preview: 'linear-gradient(160deg,#020617 0%,#0a2e2a 38%,#155e52 52%,#4c1d95 78%,#020617 100%)',
  },
  {
    id: 'hujan',
    label: 'Hujan Tenang',
    desc: 'Rintik · kabut · vignette',
    icon: '🌧',
    base: '#0a1220',
    preview: 'linear-gradient(180deg,#0b1526 0%,#16283f 55%,#3a4c63 100%)',
  },
  {
    id: 'bintang',
    label: 'Starfield Parallax',
    desc: 'Twinkle · drift · meteor',
    icon: '✨',
    base: '#030014',
    preview: 'radial-gradient(circle at 70% 20%,#4c1d95 0%,transparent 45%),radial-gradient(circle at 20% 80%,#0e7490 0%,transparent 40%),#030014',
  },
]

// Pemetaan varian lama (blob) -> varian premium baru, agar localStorage lama tidak rusak.
const LEGACY_MAP = {
  senja: 'aurora',
  hutan: 'aurora',
  laut: 'hujan',
  candy: 'bintang',
}

export function resolveVariant(id) {
  if (BG_VARIANTS.some((v) => v.id === id)) return id
  return LEGACY_MAP[id] || 'aurora'
}

export function variantOf(id) {
  return BG_VARIANTS.find((v) => v.id === resolveVariant(id)) || BG_VARIANTS[0]
}

export const DEFAULT_DATA = {
  profile: {
    name: 'Aurora Prameswari',
    bio: 'Kreator konten & desainer. Kumpulan semua karyaku, kelas, dan cara hubungi aku ada di bawah ✨',
    avatar: '',
  },
  links: [
    { id: 'ig', title: 'Instagram', url: 'https://instagram.com', brand: 'instagram', active: true },
    { id: 'tiktok', title: 'TikTok', url: 'https://tiktok.com', brand: 'auto', active: true },
    { id: 'wa', title: 'WhatsApp Bisnis', url: 'https://wa.me/6281234567890', brand: 'auto', active: true },
    { id: 'porto', title: 'Portfolio & Karya', url: 'https://behance.net', brand: 'website', active: true },
    { id: 'kelas', title: 'Kelas Online Desain', url: 'https://example.com/kelas', brand: 'auto', active: true },
    { id: 'saweria', title: 'Dukung via Saweria', url: 'https://saweria.co', brand: 'website', active: false },
  ],
  theme: {
    bgVariant: 'aurora',
    accent: '#22d3ee',
    mode: 'dark',
  },
}
