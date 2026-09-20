import { initializeApp } from 'firebase/app'
import { deleteDoc, doc, getDoc, getFirestore, serverTimestamp, setDoc } from 'firebase/firestore'

const cfg = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
}

export const isFirebaseConfigured = !!(cfg.apiKey && cfg.authDomain && cfg.projectId && cfg.appId)

let _db = null
function db() {
  if (!isFirebaseConfigured) return null
  if (!_db) _db = getFirestore(initializeApp(cfg))
  return _db
}

export const normalizeSlug = (s) => String(s || '').trim().toLowerCase()

export async function getBioCloud(slug) {
  if (!isFirebaseConfigured) return null
  try {
    const snap = await getDoc(doc(db(), 'bios', normalizeSlug(slug)))
    return snap.exists() ? snap.data()?.snapshot || null : null
  } catch {
    return null
  }
}

export async function saveBioCloud(slug, snapshot) {
  if (!isFirebaseConfigured) return null
  const key = normalizeSlug(slug)
  await setDoc(doc(db(), 'bios', key), { snapshot, updatedAt: serverTimestamp() }, { merge: true })
  return key
}

export async function deleteBioCloud(slug) {
  if (!isFirebaseConfigured) return null
  try {
    await deleteDoc(doc(db(), 'bios', normalizeSlug(slug)))
  } catch {
    // abaikan
  }
  return true
}
