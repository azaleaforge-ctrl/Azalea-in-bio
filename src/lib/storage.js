import { DEFAULT_DATA, resolveVariant } from '../data/defaults.js'
import { detectBrand } from '../components/icons/brandIcons.jsx'
import { getPublishedSnapshots, isSnapshot } from './publish.js'

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
  const { _published, ...rest } = parsed || {} // metadata export: jangan masuk state editor
  const theme = { ...fresh.theme, ...(rest.theme || {}) }
  theme.bgVariant = resolveVariant(theme.bgVariant) // migrasi varian lama
  theme.mode = 'dark' // dark-only: kunci tema gelap
  const profile = { ...fresh.profile, ...(rest.profile || {}) }
  // Guard bio: pangkas data lama/import yang melebihi 500 karakter.
  if (typeof profile.bio === 'string') profile.bio = profile.bio.slice(0, 500)
  const links = (rest.links || []).map(normalizeLink)
  return { ...fresh, ...rest, profile, theme, links }
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
  const { _published, ...rest } = data || {}
  const payload = { ...rest, _published: getPublishedSnapshots() }
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'glass-aurora-bio.json'
  a.click()
  URL.revokeObjectURL(url)
}

export async function parseImportFile(file) {
  let text
  try {
    text = await file.text()
  } catch {
    throw new Error('File tidak bisa dibaca')
  }
  let parsed
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new Error('File bukan JSON yang valid')
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Format file tidak dikenal: harus berisi data bio (profile, links, theme)')
  }
  if (!isValidShape(parsed)) {
    throw new Error('Format file tidak dikenal: field profile/links/theme tidak lengkap')
  }
  // Metadata publish (opsional, file lama tidak punya -> dianggap belum publish).
  let published = {}
  const rawPub = parsed._published
  if (rawPub !== undefined) {
    if (!rawPub || typeof rawPub !== 'object' || Array.isArray(rawPub)) {
      throw new Error('Data publish di file rusak: _published harus berupa objek')
    }
    for (const [id, snap] of Object.entries(rawPub)) {
      if (typeof id === 'string' && isSnapshot(snap)) published[id] = snap
      // entri snapshot tak valid dilewati, import data tetap jalan
    }
  }
  return { data: normalize(parsed), published }
}
