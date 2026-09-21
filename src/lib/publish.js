// Snapshot publish tanpa backend: localStorage + link berisi data (base64 di hash).
const PKEY = 'glass-aurora-published-v1'

// Homepage utama - dipakai footer halaman publik (satu sumber, jangan hardcode di view).
export const SITE_URL = 'https://azaleainbio.vercel.app/'

export function snapshotOf(data) {
  return {
    profile: data.profile,
    links: data.links,
    theme: data.theme,
    createdAt: new Date().toISOString(),
  }
}

export function isSnapshot(s) {
  return !!(s && s.profile && Array.isArray(s.links) && s.theme)
}

export function listPublished() {
  try {
    const raw = localStorage.getItem(PKEY)
    if (!raw) return []
    const obj = JSON.parse(raw)
    return Object.entries(obj).map(([id, snap]) => ({
      id,
      name: snap?.profile?.name || id,
      updatedAt: snap?.createdAt || '-',
    }))
  } catch {
    return []
  }
}

export function getPublished(id) {
  try {
    const obj = JSON.parse(localStorage.getItem(PKEY) || '{}')
    const snap = obj[id]
    return isSnapshot(snap) ? snap : null
  } catch {
    return null
  }
}

export function savePublished(id, data) {
  const obj = JSON.parse(localStorage.getItem(PKEY) || '{}')
  obj[id] = snapshotOf(data)
  localStorage.setItem(PKEY, JSON.stringify(obj))
  return obj[id]
}

export function deletePublished(id) {
  const obj = JSON.parse(localStorage.getItem(PKEY) || '{}')
  delete obj[id]
  localStorage.setItem(PKEY, JSON.stringify(obj))
}

// Seluruh snapshot terbit lokal yang valid: dibawa saat export JSON.
export function getPublishedSnapshots() {
  try {
    const obj = JSON.parse(localStorage.getItem(PKEY) || '{}')
    const out = {}
    for (const [id, snap] of Object.entries(obj || {})) {
      if (typeof id === 'string' && isSnapshot(snap)) out[id] = snap
    }
    return out
  } catch {
    return {}
  }
}

// Kembalikan status publish dari file import ke registry lokal.
// Hanya lokal (localStorage) - TIDAK menyentuh server/cloud, jadi tidak
// ada publish ganda. ID yang sudah terbit di perangkat ini tidak ditimpa.
// Return: jumlah link yang dipulihkan.
export function restorePublished(map) {
  if (!map || typeof map !== 'object' || Array.isArray(map)) return 0
  let current = {}
  try {
    current = JSON.parse(localStorage.getItem(PKEY) || '{}') || {}
  } catch {
    current = {}
  }
  let n = 0
  for (const [id, snap] of Object.entries(map)) {
    if (!/^[a-z0-9-]{3,40}$/.test(id)) continue
    if (!isSnapshot(snap)) continue
    if (current[id]) continue
    current[id] = snap
    n++
  }
  if (n > 0) {
    try {
      localStorage.setItem(PKEY, JSON.stringify(current))
    } catch {
      return 0 // storage penuh - abaikan, state tetap jalan
    }
  }
  return n
}

// base64url aman URL, tahan unicode
export function encodeData(obj) {
  const json = JSON.stringify(obj)
  return btoa(unescape(encodeURIComponent(json))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function decodeData(str) {
  const b64 = String(str).replace(/-/g, '+').replace(/_/g, '/')
  const json = decodeURIComponent(escape(atob(b64)))
  const parsed = JSON.parse(json)
  return isSnapshot(parsed) ? parsed : null
}

function appBase() {
  return window.location.href.split('#')[0]
}

export function publicUrl(id) {
  return `${appBase()}#/p/${encodeURIComponent(id)}`
}

export function prettyUrl(slug) {
  return `${window.location.origin}/${encodeURIComponent(String(slug || '').trim().toLowerCase())}`
}

// Main link: pretty ala Linktree (/nama) tapi data ikut di query (?d=...).
// Lintas-device tanpa Firebase / localStorage. Slug hanya kosmetik,
// yang dirender = snapshot dari `d`.
export function prettyUrlWithData(slug, data) {
  const s = encodeURIComponent(String(slug || '').trim().toLowerCase() || 'tautan')
  return `${window.location.origin}/${s}?d=${encodeData(snapshotOf(data))}`
}

// Link lintas-device: data ikut di URL, render tanpa localStorage.
export function publicUrlWithData(id, data) {
  return `${appBase()}#/p/${encodeURIComponent(id)}?d=${encodeData(snapshotOf(data))}`
}

export function dataOnlyUrl(data) {
  return `${appBase()}#/r?d=${encodeData(snapshotOf(data))}`
}

export function slugify(name) {
  const s = String(name || 'tautan')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return s || 'tautan'
}

// Akhiran acak tak tertebak untuk slug publik (crypto, fallback Math.random).
export function randomSuffix(len = 6) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  const out = []
  try {
    const buf = new Uint32Array(len)
    crypto.getRandomValues(buf)
    for (let i = 0; i < len; i++) out.push(chars[buf[i] % chars.length])
  } catch {
    for (let i = 0; i < len; i++) out.push(chars[Math.floor(Math.random() * chars.length)])
  }
  return out.join('')
}

// Slug publik: base + akhiran acak, total maks 40 char.
export function makePublicSlug(base) {
  let b = slugify(base).replace(/-+$/g, '')
  const suffix = randomSuffix()
  const max = 40 - suffix.length - 1
  if (b.length > max) b = b.slice(0, max).replace(/-+$/g, '')
  return `${b || 'tautan'}-${suffix}`
}

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    // Fallback untuk konteks non-secure / clipboard diblokir.
    try {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.setAttribute('readonly', '')
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      const ok = document.execCommand('copy')
      document.body.removeChild(ta)
      return !!ok
    } catch {
      return false
    }
  }
}
