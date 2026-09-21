import { DEFAULT_DATA, resolveVariant } from '../data/defaults.js'
import { detectBrand } from '../components/icons/brandIcons.jsx'

const KEY = 'glass-aurora-bio-v1'

function isValidShape(d) {
  return d && d.profile && Array.isArray(d.links) && d.theme
}

function normalizeLink(l, i) {
  const link = { ...l }
  if (!link.id) link.id = 'link-' + i + '-' + Date.now().toString(36)
  // Migrasi: emoji/huruf bebas di `icon` -> deteksi brand dari URL.
  // `brand: 'auto'` artinya selalu ikut domain URL terbaru.
  if (!link.brand) link.brand = detectBrand(link.url)
  if (typeof link.active !== 'boolean') link.active = true
  return link
}

export function normalize(parsed) {
  const fresh = structuredClone(DEFAULT_DATA)
  const theme = { ...fresh.theme, ...(parsed.theme || {}) }
  theme.bgVariant = resolveVariant(theme.bgVariant) // migrasi varian lama
  theme.mode = 'dark' // dark-only: kunci tema gelap
  const profile = { ...fresh.profile, ...(parsed.profile || {}) }
  // Guard bio: pangkas data lama/import yang melebihi 500 karakter.
  if (typeof profile.bio === 'string') profile.bio = profile.bio.slice(0, 500)
  const links = (parsed.links || []).map(normalizeLink)
  return { ...fresh, ...parsed, profile, theme, links }
}

export function loadData() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return structuredClone(DEFAULT_DATA)
    const parsed = JSON.parse(raw)
    if (!isValidShape(parsed)) return structuredClone(DEFAULT_DATA)
    return normalize(parsed)
  } catch {
    return structuredClone(DEFAULT_DATA)
  }
}

export function saveData(data) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data))
  } catch {
    // storage penuh (mis. avatar besar) - abaikan, state tetap jalan
  }
}

export function resetData() {
  const fresh = structuredClone(DEFAULT_DATA)
  saveData(fresh)
  return fresh
}

export function exportJSON(data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'glass-aurora-bio.json'
  a.click()
  URL.revokeObjectURL(url)
}

export async function parseImportFile(file) {
  const text = await file.text()
  const parsed = JSON.parse(text)
  if (!isValidShape(parsed)) throw new Error('Format JSON tidak valid')
  return normalize(parsed)
}
