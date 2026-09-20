// Snapshot publish tanpa backend: localStorage + link berisi data (base64 di hash).
const PKEY = 'glass-aurora-published-v1'

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

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    window.prompt('Salin link ini:', text)
    return false
  }
}
